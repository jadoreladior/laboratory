import { useState, useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isPast } from 'date-fns'
import { ru } from 'date-fns/locale'
import { STUDIOS, SERVICES, ADDONS, TEAM } from '../data'
import { getSettings } from '../api'
import type { ServiceCategory } from '../types'
import { useBookingStore } from '../store/bookingStore'
import { useTelegram } from '../hooks/useTelegram'
import { useAppContext } from '../App'
import { createBooking, getAvailableSlots } from '../api'

type Step = 'service' | 'engineer' | 'datetime' | 'addons' | 'confirm'

// Categories that require engineer selection
const NEEDS_ENGINEER = ['record', 'studio', 'package']

const DEFAULT_RATES = { record: 1690, studio: 2690, rent: 1360 }
const DEFAULT_PACKAGES: Record<number, number> = { 3: 7970, 5: 11970, 6: 13970 }

type CatCfg = { icon: React.ReactNode; rate: number | null; label: string; desc: string; durations: number[] }

function buildCatConfig(rates: typeof DEFAULT_RATES, pkgs: typeof DEFAULT_PACKAGES): Record<string, CatCfg> {
  return {
    record:  { icon: <Icon name="microphone" size={22} color="purple" />, rate: rates.record, label: 'Запись', desc: 'С звукорежиссёром · демо в подарок', durations: [1,2,3,4] },
    studio:  { icon: <Icon name="sliders"    size={22} color="purple" />, rate: rates.studio, label: 'Сведение', desc: 'Почасово или дистанционно', durations: [1,2,3,4] },
    rent:    { icon: <Icon name="key"        size={22} color="purple" />, rate: rates.rent, label: 'Аренда', desc: 'Без звукорежиссёра', durations: [1,2,3,4] },
    package: { icon: <Icon name="package"    size={22} color="purple" />, rate: null, label: 'Готовый трек', desc: 'Запись + сведение', durations: [3,5,6] },
    voice:   { icon: <Icon name="microphone" size={22} color="purple" />, rate: rates.record, label: 'Войс', desc: 'Запись голоса', durations: [1,2,3,4] },
  }
}

export function Booking() {
  const navigate = useNavigate()
  const location = useLocation()
  const { haptic, user } = useTelegram()
  const { telegramId } = useAppContext()
  const store = useBookingStore()

  const locState      = (location.state as any) ?? {}
  const initialCategory  = locState.category as ServiceCategory | undefined
  const initialEngineer  = locState.engineer as string | undefined
  const skipToDatetime   = !!(initialEngineer && initialCategory && locState.skipToDatetime)

  const [step, setStep] = useState<Step>(skipToDatetime ? 'datetime' : 'service')
  const [category, setCategory] = useState<ServiceCategory | null>(initialCategory ?? null)

  // Last choice memory
  const [lastCategory, setLastCategory] = useState<ServiceCategory | null>(() => {
    try { return (localStorage.getItem('lab_last_category') as ServiceCategory) || null } catch { return null }
  })
  const [localDate, setLocalDate] = useState<Date>(new Date())
  const [localTime, setLocalTime] = useState<string | null>(null)       // начало
  const [localTimeEnd, setLocalTimeEnd] = useState<string | null>(null) // конец
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(initialEngineer ?? null)
  const [calMonth, setCalMonth] = useState(new Date())
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [packagePrices, setPackagePrices] = useState(DEFAULT_PACKAGES)

  useEffect(() => {
    getSettings().then(s => {
      setRates({
        record: Number(s.record_rate) || DEFAULT_RATES.record,
        studio: Number(s.studio_rate) || DEFAULT_RATES.studio,
        rent:   Number(s.rent_rate)   || DEFAULT_RATES.rent,
      })
      setPackagePrices({
        3: Number(s.package_3h) || DEFAULT_PACKAGES[3],
        5: Number(s.package_5h) || DEFAULT_PACKAGES[5],
        6: Number(s.package_6h) || DEFAULT_PACKAGES[6],
      })
    }).catch(() => {})
  }, [])

  // Ensure studio is always set
  useEffect(() => {
    if (!store.selectedStudio) store.setStudio('A')
  }, [])

  useEffect(() => {
    if (step !== 'datetime') return
    setLoadingSlots(true)
    setLocalTime(null)
    setLocalTimeEnd(null)
    const dateStr = format(localDate, 'yyyy-MM-dd')
    getAvailableSlots('A', dateStr)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [localDate, step])

  // Computed values
  const CAT_CONFIG = buildCatConfig(rates, packagePrices)
  const catCfg = category ? CAT_CONFIG[category] : null

  // Длительность выводится из выбранного диапазона
  const duration = localTime && localTimeEnd
    ? (timeToMinutes(localTimeEnd) - timeToMinutes(localTime)) / 60
    : null

  const computedPrice = (): number => {
    if (!category || !duration) return 0
    if (category === 'package') return packagePrices[duration] ?? (catCfg?.rate ?? 0) * duration
    return (catCfg?.rate ?? 0) * duration
  }

  const getDerivedService = () => {
    if (!category || !duration) return null
    return SERVICES.find(s => s.category === category && s.duration === duration)
      ?? SERVICES.find(s => s.category === category) // fallback: любой той же категории
      ?? null
  }

  const STEPS: Step[] = skipToDatetime
    ? ['datetime', 'addons', 'confirm']
    : category && NEEDS_ENGINEER.includes(category)
      ? ['service', 'engineer', 'datetime', 'addons', 'confirm']
      : ['service', 'datetime', 'addons', 'confirm']
  const stepIndex = STEPS.indexOf(step)

  const canProceed = () => {
    if (step === 'service') return !!category
    if (step === 'engineer') return !!selectedEngineer
    if (step === 'datetime') return !!localTime && !!localTimeEnd
    if (step === 'addons') return true
    return true
  }

  const next = () => {
    if (!canProceed()) return
    haptic?.impactOccurred('light')
    if (step === 'service' && category) {
      try { localStorage.setItem('lab_last_category', category) } catch {}
      setLastCategory(category)
      if (!NEEDS_ENGINEER.includes(category)) setSelectedEngineer(null)
    }
    setStep(STEPS[stepIndex + 1])
  }

  const back = () => {
    haptic?.impactOccurred('light')
    if (stepIndex === 0) navigate(-1)
    else setStep(STEPS[stepIndex - 1])
  }

  const toggleAddon = (id: string) => {
    haptic?.selectionChanged()
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const confirm = async () => {
    const service = getDerivedService()
    if (!service || !localTime) return
    setSubmitting(true)
    haptic?.notificationOccurred('success')

    const dateStr = format(localDate, 'yyyy-MM-dd')
    const addonLabels = selectedAddons.map(id => ADDONS.find(a => a.id === id)?.label ?? id)
    const serviceLabel = `${service.title} ${duration ?? service.duration}ч${addonLabels.length ? ' + ' + addonLabels.join(', ') : ''}`
    const clientName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Клиент'
    const total = computedPrice()
    const prepay = Math.ceil(total * 0.5)

    try {
      const engineerName = selectedEngineer === 'any'
        ? 'Любой свободный'
        : TEAM.find(t => t.id === selectedEngineer)?.name ?? undefined

      if (telegramId) {
        const booking = await createBooking({
          client_name: clientName,
          telegram_id: telegramId,
          username: user?.username,
          service: serviceLabel,
          booking_date: dateStr,
          booking_time: localTime,
          duration_hours: duration ?? service.duration,
          total_price: total,
          prepay_amount: prepay,
        })
        store.addBooking({
          id: String(booking.id),
          studioId: 'A',
          serviceId: service.id,
          date: booking.booking_date,
          time: booking.booking_time,
          duration: service.duration,
          engineer: engineerName,
          totalPrice: Number(booking.total_price) || total,
          prepayAmount: Number(booking.prepay_amount) || prepay,
          status: booking.status,
          createdAt: booking.created_at,
        })
      } else {
        store.addBooking({
          id: Math.random().toString(36).slice(2),
          studioId: 'A',
          serviceId: service.id,
          date: dateStr,
          time: localTime,
          duration: duration ?? service.duration,
          engineer: engineerName,
          totalPrice: total,
          prepayAmount: prepay,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
    } catch {
      // show success anyway
    }

    store.resetBooking()
    setSubmitting(false)
    setSuccess(true)
  }

  if (success) {
    return <SuccessScreen
      onDone={() => { setSuccess(false); setStep('service'); navigate('/profile') }}
      onHome={() => { setSuccess(false); setStep('service'); navigate('/') }}
    />
  }

  const STEP_LABELS: Record<Step, string> = {
    service: 'Услуга', engineer: 'Инженер',
    datetime: 'Дата и время', addons: 'Доп. услуги', confirm: 'Подтверждение',
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button
          onClick={back}
          className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">
            Шаг {stepIndex + 1} из {STEPS.length}
          </div>
          <h1 className="text-lg font-bold text-white">{STEP_LABELS[step]}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-0.5 flex-1 rounded-full transition-all duration-500
            ${i <= stepIndex ? 'bg-[#C17BFF]' : 'bg-[#2A2A2A]'}`} />
        ))}
      </div>

      {/* ── Step: Service ── */}
      {step === 'service' && (
        <div className="px-4 animate-fade-in pb-28">
          {lastCategory && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C17BFF]" />
              <span className="text-xs text-white/30">
                В прошлый раз: <span className="text-[#C17BFF]/70">{CAT_CONFIG[lastCategory]?.label}</span>
              </span>
            </div>
          )}
          <div className="stagger space-y-3">
          {Object.entries(CAT_CONFIG).map(([id, cfg]) => {
            const isSelected = category === id
            const isLast = lastCategory === id
            return (
              <button
                key={id}
                onClick={() => { haptic?.selectionChanged(); setCategory(id as ServiceCategory) }}
                className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98] relative
                  ${isSelected
                    ? 'bg-[#C17BFF]/10 border border-[#C17BFF]/40'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
              >
                {isLast && !isSelected && (
                  <span className="absolute top-2.5 right-3 text-[9px] font-semibold text-[#C17BFF]/60 uppercase tracking-widest">
                    прошлый раз
                  </span>
                )}
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'bg-[#C17BFF]/20 text-[#C17BFF]' : 'bg-white/5 text-white/40'}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-white">{cfg.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{cfg.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold text-sm ${isSelected ? 'text-[#C17BFF]' : 'text-white/60'}`}>
                      {cfg.rate ? `${cfg.rate.toLocaleString()} ₽/ч` : 'от 7 970 ₽'}
                    </div>
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 ml-auto flex items-center justify-center
                      ${isSelected ? 'border-[#C17BFF] bg-[#C17BFF]' : 'border-white/20'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
          </div>
        </div>
      )}

      {/* ── Step: Engineer ── */}
      {step === 'engineer' && (
        <div className="px-4 space-y-3 animate-fade-in pb-28">
          <p className="text-xs text-white/40 mb-4 leading-relaxed">
            Выберите звукорежиссёра или оставьте выбор за нами — назначим лучшего свободного на ваше время.
          </p>

          {/* Any engineer option */}
          <button
            onClick={() => { haptic?.selectionChanged(); setSelectedEngineer('any') }}
            className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98]
              ${selectedEngineer === 'any'
                ? 'bg-[#C17BFF]/10 border border-[#C17BFF]/40'
                : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg
                ${selectedEngineer === 'any' ? 'bg-[#C17BFF]/20' : 'bg-white/5'}`}>
                🎲
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">Любой свободный</div>
                <div className="text-xs text-white/40 mt-0.5">Назначим лучшего на ваше время</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedEngineer === 'any' ? 'border-[#C17BFF] bg-[#C17BFF]' : 'border-white/20'}`}>
                {selectedEngineer === 'any' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          </button>

          {/* Individual engineers */}
          {TEAM.map(member => (
            <button
              key={member.id}
              onClick={() => { haptic?.selectionChanged(); setSelectedEngineer(member.id) }}
              className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98]
                ${selectedEngineer === member.id
                  ? 'bg-[#C17BFF]/10 border border-[#C17BFF]/40'
                  : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
            >
              <div className="flex items-center gap-4">
                <img src={member.photo} alt={member.name}
                  className="w-11 h-11 rounded-full object-cover object-top flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm">{member.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{member.specialization}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                  ${selectedEngineer === member.id ? 'border-[#C17BFF] bg-[#C17BFF]' : 'border-white/20'}`}>
                  {selectedEngineer === member.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Step: DateTime ── */}
      {step === 'datetime' && (
        <div className="animate-fade-in pb-28">

          {/* Карточка инженера — показывается всегда когда выбран конкретный */}
          {selectedEngineer && selectedEngineer !== 'any' && (() => {
            const eng = TEAM.find(m => m.id === selectedEngineer)
            return eng ? (
              <div className="mx-4 mb-4 rounded-2xl overflow-hidden border border-[#C17BFF]/20 bg-[#C17BFF]/8">
                <div className="flex items-center gap-0">
                  {/* Фото инженера */}
                  <div className="flex-shrink-0" style={{ width: 80, height: 80 }}>
                    <img src={eng.photo} alt={eng.name}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center top' }} />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <div className="text-[10px] font-semibold text-[#C17BFF] uppercase tracking-widest mb-0.5">Звукорежиссёр</div>
                    <div className="font-bold text-white text-sm leading-tight">{eng.name}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{eng.specialization}</div>
                  </div>
                  {/* Живая цена */}
                  {duration && catCfg && (
                    <div className="pr-3 text-right flex-shrink-0">
                      <div className="text-[10px] text-white/30 mb-0.5">{duration} ч</div>
                      <div className="font-black text-white text-base">
                        {computedPrice().toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null
          })()}

          {/* Живая цена без конкретного инженера */}
          {(!selectedEngineer || selectedEngineer === 'any') && duration && catCfg && (
            <div className="mx-4 mb-4 px-4 py-3 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between">
              <div className="text-sm text-white/50">{duration} {duration === 1 ? 'час' : duration < 5 ? 'часа' : 'часов'} · {catCfg.label}</div>
              <div className="font-black text-white text-lg">{computedPrice().toLocaleString('ru-RU')} ₽</div>
            </div>
          )}

          {/* Если время ещё не выбрано — показываем ставку */}
          {!localTime && catCfg && (
            <div className="mx-4 mb-4 px-4 py-2.5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between">
              <div className="text-xs text-white/40">{catCfg.label}</div>
              <div className="text-xs text-white/50">
                {category === 'package'
                  ? `от ${Object.values(packagePrices).sort((a,b)=>a-b)[0].toLocaleString('ru-RU')} ₽`
                  : `${catCfg.rate?.toLocaleString('ru-RU')} ₽/ч`}
              </div>
            </div>
          )}

          {/* Month calendar */}
          <div className="px-4 mb-4">
            {/* Month header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalMonth(m => subMonths(m, 1))}
                disabled={calMonth.getMonth() === new Date().getMonth() && calMonth.getFullYear() === new Date().getFullYear()}
                className="w-8 h-8 rounded-full card-lab flex items-center justify-center disabled:opacity-30"
              >
                <Icon name="arrow-left" size={14} />
              </button>
              <p className="text-sm font-bold text-white capitalize">
                {format(calMonth, 'LLLL yyyy', { locale: ru })}
              </p>
              <button
                onClick={() => setCalMonth(m => addMonths(m, 1))}
                disabled={calMonth > addMonths(new Date(), 2)}
                className="w-8 h-8 rounded-full card-lab flex items-center justify-center disabled:opacity-30"
              >
                <Icon name="arrow-right" size={14} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                <div key={d} className="text-center text-[10px] text-white/25 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            {(() => {
              const start = startOfMonth(calMonth)
              const end = endOfMonth(calMonth)
              const startDow = (getDay(start) + 6) % 7
              const prefix = Array.from({ length: startDow }, (_, i) => addDays(start, -(startDow - i)))
              const monthDays = eachDayOfInterval({ start, end })
              const total = prefix.length + monthDays.length
              const suffix = Array.from({ length: total % 7 === 0 ? 0 : 7 - (total % 7) }, (_, i) => addDays(end, i + 1))
              const maxDate = addDays(new Date(), 60)
              return (
                <div className="grid grid-cols-7 gap-1">
                  {[...prefix, ...monthDays, ...suffix].map((day, idx) => {
                    const inMonth = day.getMonth() === calMonth.getMonth()
                    const past = isPast(day) && !isToday(day)
                    const tooFar = day > maxDate
                    const disabled = !inMonth || past || tooFar
                    const sel = isSameDay(day, localDate)
                    const tod = isToday(day)
                    return (
                      <button
                        key={idx}
                        disabled={disabled}
                        onClick={() => { haptic?.selectionChanged(); setLocalDate(day) }}
                        className={`aspect-square rounded-xl flex items-center justify-center transition-all
                          ${!inMonth ? 'opacity-0 pointer-events-none' : ''}
                          ${sel ? 'bg-[#C17BFF]' : tod ? 'bg-[#C17BFF]/15 ring-1 ring-[#C17BFF]/50' : disabled ? '' : 'bg-[#1A1A1A] active:scale-90'}
                          ${disabled && inMonth ? 'opacity-25' : ''}`}
                      >
                        <span className={`text-sm font-bold
                          ${sel ? 'text-white' : tod ? 'text-[#C17BFF]' : 'text-white'}`}>
                          {format(day, 'd')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Time picker */}
          <div className="px-4">

            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
                {!localTime ? 'Выберите начало' : !localTimeEnd ? 'Теперь выберите конец' : 'Время выбрано'}
              </p>
              {localTime && (
                <button
                  onClick={() => { setLocalTime(null); setLocalTimeEnd(null) }}
                  className="text-xs text-white/30 active:text-white/60 transition-colors"
                >
                  Сбросить
                </button>
              )}
            </div>
            {loadingSlots ? (
              <div className="text-center py-8 text-white/30 text-sm">Загружаем слоты...</div>
            ) : (() => {
              const rawSlots = slots.length > 0 ? slots : [
                '00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00',
                '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00',
                '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00',
              ].map(t => ({ time: t, available: true }))

              // Valid durations depend on category
              const validDurations = category === 'package' ? [3, 5, 6] : null // null = any integer ≥ 1

              type SlotState = 'available' | 'unavailable' | 'start' | 'end' | 'in-range' | 'valid-end' | 'invalid-end'

              const getSlotState = (slot: { time: string; available: boolean }): SlotState => {
                const slotMin = timeToMinutes(slot.time)

                if (!localTime) {
                  return slot.available ? 'available' : 'unavailable'
                }

                const startMin = timeToMinutes(localTime)

                if (localTimeEnd) {
                  const endMin = timeToMinutes(localTimeEnd)
                  if (slot.time === localTime) return 'start'
                  if (slot.time === localTimeEnd) return 'end'
                  if (slotMin > startMin && slotMin < endMin) return 'in-range'
                  return slot.available ? 'available' : 'unavailable'
                }

                // Start set, no end yet
                if (slot.time === localTime) return 'start'
                if (slotMin <= startMin) return slot.available ? 'available' : 'unavailable'

                // After start — check if valid end
                const potentialDuration = (slotMin - startMin) / 60
                const isDurationValid = validDurations
                  ? validDurations.includes(potentialDuration)
                  : Number.isInteger(potentialDuration) && potentialDuration >= 1

                if (!isDurationValid) return 'invalid-end'

                // Check all slots in [start, slot) are available
                const rangeOk = rawSlots
                  .filter(s => { const sm = timeToMinutes(s.time); return sm >= startMin && sm < slotMin })
                  .every(s => s.available)

                if (!rangeOk || !slot.available) return 'invalid-end'

                return 'valid-end'
              }

              const handleSlotClick = (slot: { time: string; available: boolean }) => {
                haptic?.selectionChanged()
                const slotMin = timeToMinutes(slot.time)

                if (!localTime) {
                  if (!slot.available) return
                  setLocalTime(slot.time)
                  setLocalTimeEnd(null)
                  return
                }

                if (localTimeEnd) {
                  // Both set → reset, set clicked as new start
                  if (!slot.available) return
                  setLocalTime(slot.time)
                  setLocalTimeEnd(null)
                  return
                }

                const startMin = timeToMinutes(localTime)

                if (slotMin <= startMin) {
                  // Before/at current start → set as new start
                  if (!slot.available) return
                  setLocalTime(slot.time)
                  setLocalTimeEnd(null)
                  return
                }

                const state = getSlotState(slot)
                if (state === 'valid-end') {
                  setLocalTimeEnd(slot.time)
                }
              }

              return (
                <div className="grid grid-cols-4 gap-2">
                  {rawSlots.map(slot => {
                    const state = getSlotState(slot)
                    return (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all
                          ${state === 'start' || state === 'end'
                            ? 'bg-[#C17BFF] text-white shadow-lg'
                            : state === 'in-range'
                              ? 'bg-[#C17BFF]/20 text-[#C17BFF]/80 border border-[#C17BFF]/30 cursor-not-allowed pointer-events-none'
                              : state === 'valid-end'
                                ? 'bg-transparent border-2 border-[#C17BFF]/70 text-[#C17BFF] active:scale-95'
                                : state === 'invalid-end'
                                  ? 'opacity-25 cursor-not-allowed bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                                  : state === 'unavailable'
                                    ? 'opacity-20 cursor-not-allowed bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                                    : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white active:scale-95'}`}
                      >
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {/* Hint below grid when start is selected but no end */}
            {localTime && !localTimeEnd && category === 'package' && (
              <p className="mt-3 text-[11px] text-white/30 text-center">
                Для тарифа «Готовый трек» доступны сеансы 3, 5 или 6 часов
              </p>
            )}

            {/* Summary: диапазон + инженер — появляется после выбора обоих */}
            {localTime && localTimeEnd && (
              <div className="mt-4 p-4 rounded-2xl bg-[#C17BFF]/8 border border-[#C17BFF]/20 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C17BFF]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C17BFF]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-widest mb-0.5">Вы будете в студии</div>
                    <div className="text-base font-bold text-white">
                      {localTime} — {localTimeEnd}
                      {duration && <span className="text-sm font-normal text-white/40 ml-2">· {duration} ч</span>}
                    </div>
                  </div>
                </div>
                {selectedEngineer && (
                  <div className="flex items-center gap-3 pt-3 border-t border-[#C17BFF]/15">
                    <div className="w-8 h-8 rounded-xl bg-[#C17BFF]/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#C17BFF]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/35 uppercase tracking-widest mb-0.5">Звукорежиссёр</div>
                      <div className="text-sm font-semibold text-white">
                        {selectedEngineer === 'any'
                          ? 'Назначим лучшего свободного'
                          : TEAM.find(t => t.id === selectedEngineer)?.name ?? '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step: Add-ons ── */}
      {step === 'addons' && (
        <div className="px-4 animate-fade-in pb-28">
          <p className="text-sm text-white/40 mb-5 leading-relaxed">
            Добавь к сессии дополнительные услуги или пропусти этот шаг.
          </p>
          <div className="space-y-3">
            {ADDONS.map(addon => {
              const isSelected = selectedAddons.includes(addon.id)
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98]
                    ${isSelected
                      ? 'bg-[#C17BFF]/10 border border-[#C17BFF]/40'
                      : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${isSelected ? 'bg-[#C17BFF] border-[#C17BFF]' : 'border-white/20'}`}>
                      {isSelected && <Icon name="check" size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{addon.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{addon.description}</div>
                    </div>
                    <div className={`text-sm font-bold flex-shrink-0 ${isSelected ? 'text-[#C17BFF]' : 'text-white/50'}`}>
                      {addon.priceLabel}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step: Confirm ── */}
      {step === 'confirm' && category && duration && (
        <div className="px-4 animate-fade-in pb-6">
          {/* Studio image */}
          <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: 140 }}>
            <img src={STUDIOS[0].images[1] ?? STUDIOS[0].images[0]} alt="Studio"
              className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <div className="text-white font-bold text-sm">Лаборатория</div>
              <div className="text-white/50 text-xs mt-0.5">Большой Сампсониевский 60Н</div>
            </div>
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#C17BFF]"
              style={{ boxShadow: '0 0 12px rgba(193,123,255,0.9)' }} />
          </div>

          {/* Summary card */}
          <div className="card-lab p-4 mb-4 space-y-3">
            <ConfirmRow label="Услуга" value={`${CAT_CONFIG[category].label}`} />
            {selectedEngineer && selectedEngineer !== 'any' && (
              <ConfirmRow label="Инженер" value={TEAM.find(t => t.id === selectedEngineer)?.name ?? '—'} />
            )}
            <ConfirmRow label="Дата" value={format(localDate, 'd MMMM yyyy', { locale: ru })} />
            <ConfirmRow
              label="Время"
              value={localTime && localTimeEnd ? `${localTime} — ${localTimeEnd} · ${duration} ч` : localTime ?? '—'}
            />
            {selectedAddons.length > 0 && (
              <ConfirmRow
                label="Доп. услуги"
                value={selectedAddons.map(id => ADDONS.find(a => a.id === id)?.label ?? id).join(', ')}
              />
            )}
            <div className="pt-3 border-t border-[#2A2A2A] space-y-3">
              <ConfirmRow label="Итого" value={`${computedPrice().toLocaleString()} ₽`} bold />
              <ConfirmRow
                label="Предоплата 50%"
                value={`${Math.ceil(computedPrice() * 0.5).toLocaleString()} ₽`}
                accent
              />
            </div>
          </div>

          {/* Reminder notice */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#C17BFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-[#C17BFF]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-white mb-0.5">Напомним за 6 часов</div>
              <div className="text-[11px] text-white/40 leading-relaxed">
                В день сессии пришлём напоминание в Telegram. Администратор свяжется для оплаты предоплаты.
              </div>
            </div>
          </div>

          <button
            onClick={confirm}
            disabled={submitting}
            className={`btn-lily w-full py-4 rounded-2xl font-bold text-base transition-all
              ${submitting ? 'opacity-50' : ''}`}
          >
            {submitting ? 'Отправляем...' : 'Подтвердить запись'}
          </button>
        </div>
      )}

      {/* Bottom "Далее" button */}
      {step !== 'confirm' && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 pb-3 z-30">
          <button
            onClick={next}
            disabled={!canProceed()}
            className={`btn-lily w-full py-4 rounded-2xl font-bold text-base transition-all
              ${!canProceed() ? 'opacity-30' : ''}`}
          >
            {step === 'addons' ? (selectedAddons.length > 0 ? `Далее · ${selectedAddons.length} доп.` : 'Пропустить') : 'Далее'}
          </button>
        </div>
      )}
    </div>
  )
}

function calcEndTime(start: string, durationHours: number): string {
  const [h, m] = start.split(':').map(Number)
  const endH = (h + durationHours) % 24
  return `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}


function ConfirmRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-white/40 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${accent ? 'text-[#C17BFF] font-semibold' : bold ? 'text-white font-bold' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

function SuccessScreen({ onDone, onHome }: { onDone: () => void; onHome: () => void }) {
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      ringRef.current?.classList.add('success-ring-animate')
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <div className="relative mb-8">
        <div
          ref={ringRef}
          className="success-ring w-28 h-28 rounded-full border-2 border-[#C17BFF]/20 flex items-center justify-center"
        >
          <div
            className="w-20 h-20 rounded-full bg-[#C17BFF]/5 flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(193,123,255,0.15), 0 0 80px rgba(193,123,255,0.08)' }}
          >
            <svg className="w-9 h-9 text-[#C17BFF] success-check" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 success-orbit">
          <div className="w-2 h-2 rounded-full bg-[#C17BFF] absolute -top-1 left-1/2 -translate-x-1/2"
            style={{ boxShadow: '0 0 8px rgba(193,123,255,0.9)' }} />
        </div>
      </div>

      <h2 className="font-display text-2xl font-black text-white mb-2">
        Запись создана!
      </h2>
      <p className="font-display text-lg text-[#C17BFF] mb-3">
        До встречи в студии
      </p>
      <p className="text-sm text-white/40 mb-4 max-w-xs leading-relaxed">
        Подтверждение уже летит в Telegram. Напомним за 6 часов до сессии — просто приходи и твори.
      </p>

      {/* Reminder chip */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#C17BFF]/10 border border-[#C17BFF]/20 mb-8">
        <svg className="w-4 h-4 text-[#C17BFF] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <span className="text-xs text-[#C17BFF] font-medium">Напомним за 6 часов в Telegram</span>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button onClick={onDone} className="btn-lily w-full py-4 rounded-2xl font-bold text-white">
          Мои записи
        </button>
        <button onClick={onHome} className="w-full py-3.5 rounded-2xl font-medium text-white/50 bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform">
          На главную
        </button>
      </div>
    </div>
  )
}
