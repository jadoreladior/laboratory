import { useState, useEffect, useRef } from 'react'
import { Mic2, Sliders, Key, Package, Check } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, addDays, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { STUDIOS, SERVICES, ADDONS } from '../data'
import type { ServiceCategory } from '../types'
import { useBookingStore } from '../store/bookingStore'
import { useTelegram } from '../hooks/useTelegram'
import { useAppContext } from '../App'
import { createBooking, getAvailableSlots } from '../api'

type Step = 'service' | 'duration' | 'datetime' | 'addons' | 'confirm'

function getDates(count = 14): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(new Date(), i))
}

const CAT_CONFIG: Record<string, { icon: React.ReactNode; rate: number | null; label: string; desc: string; durations: number[] }> = {
  record:  { icon: <Mic2 size={22} strokeWidth={1.5} />, rate: 1690, label: 'Запись', desc: 'С звукорежиссёром · демо в подарок', durations: [1,2,3,4] },
  studio:  { icon: <Sliders size={22} strokeWidth={1.5} />, rate: 2690, label: 'Сведение', desc: 'Почасово или дистанционно', durations: [1,2,3,4] },
  rent:    { icon: <Key size={22} strokeWidth={1.5} />, rate: 1360, label: 'Аренда', desc: 'Без звукорежиссёра', durations: [1,2,3,4] },
  package: { icon: <Package size={22} strokeWidth={1.5} />, rate: null, label: 'Готовый трек', desc: 'Запись + сведение', durations: [3,5,6] },
}

const PACKAGE_PRICES: Record<number, number> = { 3: 7970, 5: 11970, 6: 13970 }

export function Booking() {
  const navigate = useNavigate()
  const location = useLocation()
  const { haptic, user } = useTelegram()
  const { telegramId } = useAppContext()
  const store = useBookingStore()

  const initialCategory = (location.state as any)?.category as ServiceCategory | undefined

  const [step, setStep] = useState<Step>('service')
  const [category, setCategory] = useState<ServiceCategory | null>(initialCategory ?? null)
  const [duration, setDuration] = useState<number | null>(null)
  const [localDate, setLocalDate] = useState<Date>(new Date())
  const [localTime, setLocalTime] = useState<string | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Ensure studio is always set
  useEffect(() => {
    if (!store.selectedStudio) store.setStudio('A')
  }, [])

  useEffect(() => {
    if (step !== 'datetime') return
    setLoadingSlots(true)
    setLocalTime(null)
    const dateStr = format(localDate, 'yyyy-MM-dd')
    getAvailableSlots('A', dateStr)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [localDate, step])

  // Computed values
  const catCfg = category ? CAT_CONFIG[category] : null
  const computedPrice = (): number => {
    if (!category || !duration) return 0
    if (category === 'package') return PACKAGE_PRICES[duration] ?? 0
    return (catCfg?.rate ?? 0) * duration
  }

  const getDerivedService = () => {
    if (!category || !duration) return null
    return SERVICES.find(s => s.category === category && s.duration === duration) ?? null
  }

  const STEPS: Step[] = ['service', 'duration', 'datetime', 'addons', 'confirm']
  const stepIndex = STEPS.indexOf(step)

  const canProceed = () => {
    if (step === 'service') return !!category
    if (step === 'duration') return !!duration
    if (step === 'datetime') return !!localTime
    if (step === 'addons') return true
    return true
  }

  const next = () => {
    if (!canProceed()) return
    haptic?.impactOccurred('light')
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
    const serviceLabel = `${service.title} ${service.duration}ч${addonLabels.length ? ' + ' + addonLabels.join(', ') : ''}`
    const clientName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Клиент'
    const total = computedPrice()
    const prepay = Math.ceil(total * 0.5)

    try {
      if (telegramId) {
        const booking = await createBooking({
          client_name: clientName,
          telegram_id: telegramId,
          username: user?.username,
          service: serviceLabel,
          booking_date: dateStr,
          booking_time: localTime,
          duration_hours: service.duration,
          total_price: total,
          prepay_amount: prepay,
        })
        store.addBooking({
          id: String(booking.id),
          studioId: 'A',
          serviceId: service.id,
          date: booking.booking_date,
          time: booking.booking_time,
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

  const STEP_LABELS = ['Услуга', 'Длительность', 'Дата и время', 'Доп. услуги', 'Подтверждение']

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
          <h1 className="text-lg font-bold text-white">{STEP_LABELS[stepIndex]}</h1>
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
        <div className="px-4 space-y-3 animate-fade-in pb-28">
          {Object.entries(CAT_CONFIG).map(([id, cfg]) => {
            const isSelected = category === id
            return (
              <button
                key={id}
                onClick={() => { haptic?.selectionChanged(); setCategory(id as ServiceCategory); setDuration(null) }}
                className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98]
                  ${isSelected
                    ? 'bg-[#C17BFF]/10 border border-[#C17BFF]/40'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'bg-[#C17BFF]/20 text-[#C17BFF]' : 'bg-white/5 text-white/40'}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-base ${isSelected ? 'text-white' : 'text-white'}`}>
                      {cfg.label}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{cfg.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold text-sm ${isSelected ? 'text-[#C17BFF]' : 'text-white/60'}`}>
                      {cfg.rate ? `${cfg.rate.toLocaleString()} ₽/ч` : 'от 7 970 ₽'}
                    </div>
                    {/* Radio indicator */}
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
      )}

      {/* ── Step: Duration ── */}
      {step === 'duration' && catCfg && (
        <div className="px-4 animate-fade-in pb-28">
          {/* Price hint */}
          <div className="bg-[#C17BFF]/8 border border-[#C17BFF]/20 rounded-2xl p-4 mb-5">
            <div className="text-xs text-white/50 mb-1">Базовая ставка</div>
            <div className="font-display font-black text-xl text-[#C17BFF]">
              {catCfg.rate ? `${catCfg.rate.toLocaleString()} ₽` : ''}
              <span className="text-sm font-normal text-white/40 ml-1">{catCfg.rate ? '/ час' : ''}</span>
            </div>
          </div>

          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">
            Выберите длительность
          </p>

          <div className="grid grid-cols-2 gap-3">
            {catCfg.durations.map(h => {
              const price = category === 'package' ? PACKAGE_PRICES[h] : (catCfg.rate ?? 0) * h
              const isSelected = duration === h
              return (
                <button
                  key={h}
                  onClick={() => { haptic?.selectionChanged(); setDuration(h) }}
                  className={`p-4 rounded-2xl text-left transition-all active:scale-[0.97]
                    ${isSelected
                      ? 'bg-[#C17BFF]/15 border border-[#C17BFF]/50'
                      : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
                >
                  <div className={`font-display font-black text-2xl mb-1 ${isSelected ? 'text-[#C17BFF]' : 'text-white'}`}>
                    {h}ч
                  </div>
                  <div className="text-xs text-white/40 mb-2">
                    {h === 1 ? '1 час' : h < 5 ? `${h} часа` : `${h} часов`}
                  </div>
                  <div className={`font-bold text-base ${isSelected ? 'text-white' : 'text-white/80'}`}>
                    {price.toLocaleString()} ₽
                  </div>
                  {isSelected && (
                    <div className="mt-2 text-[10px] text-[#C17BFF]/70">
                      Предоплата {Math.ceil(price * 0.5).toLocaleString()} ₽
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step: DateTime ── */}
      {step === 'datetime' && (
        <div className="animate-fade-in pb-28">
          {/* Date picker */}
          <div className="px-4 mb-6">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Дата</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {getDates().map(date => {
                const isSelected = isSameDay(date, localDate)
                const isToday = isSameDay(date, new Date())
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => { haptic?.selectionChanged(); setLocalDate(date) }}
                    className={`flex-shrink-0 flex flex-col items-center px-3.5 py-3 rounded-2xl transition-all min-w-[56px]
                      ${isSelected
                        ? 'bg-[#C17BFF] text-white'
                        : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white'}`}
                  >
                    <span className={`text-[10px] font-medium uppercase ${isSelected ? 'opacity-80' : 'opacity-40'}`}>
                      {isToday ? 'сег' : format(date, 'EEE', { locale: ru }).slice(0, 3)}
                    </span>
                    <span className="text-lg font-black leading-tight">{format(date, 'd')}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time picker */}
          <div className="px-4">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Время начала</p>
            {loadingSlots ? (
              <div className="text-center py-8 text-white/30 text-sm">Загружаем слоты...</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(slots.length > 0 ? slots : [
                  '10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00',
                  '18:00','19:00','20:00','21:00','22:00'
                ].map(t => ({ time: t, available: true }))).map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && (haptic?.selectionChanged(), setLocalTime(slot.time))}
                    disabled={!slot.available}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all
                      ${!slot.available
                        ? 'opacity-20 cursor-not-allowed bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                        : localTime === slot.time
                          ? 'bg-[#C17BFF] text-white'
                          : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white'}`}
                  >
                    {slot.time}
                  </button>
                ))}
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
                      {isSelected && <Check size={13} strokeWidth={3} className="text-white" />}
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
            <ConfirmRow label="Длительность" value={`${duration} ч`} />
            <ConfirmRow label="Дата" value={format(localDate, 'd MMMM yyyy', { locale: ru })} />
            <ConfirmRow label="Время" value={localTime ?? '—'} />
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

          <p className="text-[11px] text-white/30 text-center mb-5 px-4">
            После подтверждения с тобой свяжется администратор для оплаты предоплаты
          </p>

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
      <p className="text-sm text-white/40 mb-10 max-w-xs leading-relaxed">
        Мы уже знаем о тебе. Напомним за день до сессии — просто приходи и твори.
      </p>

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
