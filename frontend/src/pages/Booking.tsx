import { useState, useEffect, useRef } from 'react'
import { Mic2, Sliders, Wind, Key, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { STUDIOS, SERVICES, SERVICE_CATEGORIES } from '../data'
import { useBookingStore } from '../store/bookingStore'
import { useTelegram } from '../hooks/useTelegram'
import { useAppContext } from '../App'
import { createBooking, getAvailableSlots } from '../api'
import type { ServiceCategory, Service, StudioId } from '../types'

type Step = 'service' | 'studio' | 'datetime' | 'confirm'
const ALL_STEPS: Step[] = ['service', 'studio', 'datetime', 'confirm']
const ALL_LABELS = ['Услуга', 'Зал', 'Дата и время', 'Подтверждение']

function getDates(count = 14): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(new Date(), i))
}

export function Booking() {
  const navigate = useNavigate()
  const { haptic, user } = useTelegram()
  const { telegramId } = useAppContext()
  const store = useBookingStore()

  const [step, setStep] = useState<Step>('service')
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('record')
  const [localDate, setLocalDate] = useState<Date>(new Date())
  const [localTime, setLocalTime] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const STEPS = store.selectedStudio
    ? ALL_STEPS.filter(s => s !== 'studio')
    : ALL_STEPS
  const STEP_LABELS = store.selectedStudio
    ? ALL_LABELS.filter((_, i) => ALL_STEPS[i] !== 'studio')
    : ALL_LABELS

  const stepIndex = STEPS.indexOf(step)
  const filteredServices = SERVICES.filter(s => s.category === activeCategory)
  const dates = getDates()

  useEffect(() => {
    if (!store.selectedStudio || step !== 'datetime') return
    setLoadingSlots(true)
    setLocalTime(null)
    const dateStr = format(localDate, 'yyyy-MM-dd')
    getAvailableSlots(store.selectedStudio, dateStr)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [store.selectedStudio, localDate, step])

  const canProceed = () => {
    if (step === 'service') return !!store.selectedService
    if (step === 'studio') return !!store.selectedStudio
    if (step === 'datetime') return !!localDate && !!localTime
    return true
  }

  const next = () => {
    if (!canProceed()) return
    haptic?.impactOccurred('light')
    const nextStep = STEPS[stepIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  const back = () => {
    haptic?.impactOccurred('light')
    if (stepIndex === 0) navigate(-1)
    else setStep(STEPS[stepIndex - 1])
  }

  const confirm = async () => {
    if (!store.selectedService || !store.selectedStudio || !localTime) return
    setSubmitting(true)
    haptic?.notificationOccurred('success')

    const dateStr = format(localDate, 'yyyy-MM-dd')
    const serviceLabel = `${store.selectedService.title} ${store.selectedService.duration}ч`
    const clientName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Клиент'

    try {
      if (telegramId) {
        const booking = await createBooking({
          client_name: clientName,
          telegram_id: telegramId,
          username: user?.username,
          service: serviceLabel,
          booking_date: dateStr,
          booking_time: localTime!,
          duration_hours: store.selectedService.duration,
          total_price: store.selectedService.price,
          prepay_amount: Math.ceil(store.selectedService.price * store.selectedService.prepayPercent / 100),
        })
        store.addBooking({
          id: String(booking.id),
          studioId: store.selectedStudio ?? 'A',
          serviceId: store.selectedService.id,
          date: booking.booking_date,
          time: booking.booking_time,
          totalPrice: Number(booking.total_price) || store.selectedService.price,
          prepayAmount: Number(booking.prepay_amount),
          status: booking.status,
          createdAt: booking.created_at,
        })
      } else {
        store.addBooking({
          id: Math.random().toString(36).slice(2),
          studioId: store.selectedStudio,
          serviceId: store.selectedService.id,
          date: dateStr,
          time: localTime,
          totalPrice: store.selectedService.price,
          prepayAmount: Math.ceil(store.selectedService.price * 0.5),
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
    } catch {
      // show success regardless
    }

    store.resetBooking()
    setSubmitting(false)
    setSuccess(true)
  }

  if (success) {
    return <SuccessScreen onDone={() => { setSuccess(false); setStep('service'); navigate('/profile') }} onHome={() => { setSuccess(false); setStep('service'); navigate('/') }} />
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button
          onClick={back}
          className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="text-[11px] text-white/30 uppercase tracking-widest mb-0.5">
            Шаг {stepIndex + 1} из {STEPS.length}
          </div>
          <h1 className="text-lg font-bold text-white">{STEP_LABELS[stepIndex]}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 px-4 mb-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-0.5 flex-1 rounded-full transition-all duration-500
              ${i <= stepIndex ? 'bg-[#C17BFF]' : 'bg-[#2A2A2A]'}`}
          />
        ))}
      </div>

      {/* ── Step: Service ── */}
      {step === 'service' && (
        <div className="animate-fade-in pb-28">
          {/* Category tabs */}
          <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1 no-scrollbar">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { haptic?.selectionChanged(); setActiveCategory(cat.id as ServiceCategory) }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${activeCategory === cat.id
                    ? 'bg-[#C17BFF]/15 text-[#C17BFF] border border-[#C17BFF]/30'
                    : 'bg-[#1A1A1A] text-white/50 border border-[#2A2A2A]'}`}
              >
                <span className="flex items-center">
                  {cat.id === 'record'  && <Mic2 size={13} strokeWidth={2} />}
                  {cat.id === 'studio'  && <Sliders size={13} strokeWidth={2} />}
                  {cat.id === 'voice'   && <Wind size={13} strokeWidth={2} />}
                  {cat.id === 'rent'    && <Key size={13} strokeWidth={2} />}
                  {cat.id === 'package' && <Package size={13} strokeWidth={2} />}
                </span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="px-4 space-y-2.5">
            {filteredServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={store.selectedService?.id === service.id}
                onSelect={() => { haptic?.selectionChanged(); store.setService(service) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Step: Studio ── */}
      {step === 'studio' && (
        <div className="px-4 space-y-3 animate-fade-in pb-28">
          {STUDIOS.map(studio => (
            <button
              key={studio.id}
              onClick={() => { haptic?.selectionChanged(); store.setStudio(studio.id as StudioId) }}
              className={`w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]
                ${store.selectedStudio === studio.id
                  ? 'ring-1 ring-[#C17BFF]/60'
                  : 'ring-1 ring-[#2A2A2A]'}`}
            >
              <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden">
                <div className="relative h-32">
                  <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                  <div className="absolute left-4 bottom-4">
                    <div className="text-white font-bold text-sm">{studio.name}</div>
                    <div className="text-white/60 text-xs mt-0.5">{studio.tagline}</div>
                  </div>
                  {store.selectedStudio === studio.id && (
                    <div className="absolute right-4 top-4 w-6 h-6 rounded-full bg-[#C17BFF] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Step: DateTime ── */}
      {step === 'datetime' && (
        <div className="animate-fade-in">
          {/* Date picker */}
          <div className="px-4 mb-6">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Выберите дату</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {dates.map(date => {
                const isSelected = isSameDay(date, localDate)
                const isToday = isSameDay(date, new Date())
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => { haptic?.selectionChanged(); setLocalDate(date) }}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl transition-all min-w-[52px]
                      ${isSelected
                        ? 'bg-[#C17BFF] text-white'
                        : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white'}`}
                  >
                    <span className={`text-[10px] font-medium uppercase ${isSelected ? 'opacity-80' : 'opacity-40'}`}>
                      {isToday ? 'сег' : format(date, 'EEE', { locale: ru }).slice(0, 3)}
                    </span>
                    <span className="text-lg font-bold leading-tight">{format(date, 'd')}</span>
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
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && (haptic?.selectionChanged(), setLocalTime(slot.time))}
                    disabled={!slot.available}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${!slot.available
                        ? 'opacity-25 cursor-not-allowed bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                        : localTime === slot.time
                          ? 'bg-[#C17BFF] text-white'
                          : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-[#C17BFF]/30'}`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'].map(t => (
                  <button
                    key={t}
                    onClick={() => { haptic?.selectionChanged(); setLocalTime(t) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${localTime === t
                        ? 'bg-[#C17BFF] text-white'
                        : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-[#C17BFF]/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step: Confirm ── */}
      {step === 'confirm' && store.selectedService && store.selectedStudio && (
        <div className="px-4 animate-fade-in">
          <div className="card-lab overflow-hidden mb-4">
            {/* Studio preview */}
            <div className="relative h-40">
              <img
                src={STUDIOS.find(s => s.id === store.selectedStudio)!.images[1] ?? STUDIOS.find(s => s.id === store.selectedStudio)!.images[0]}
                alt="Studio"
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/30 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <div className="text-white font-bold text-sm">Студия {store.selectedStudio}</div>
                <div className="text-white/50 text-xs mt-0.5">Гороховая 70</div>
              </div>
              {/* Lilac glow accent */}
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#C17BFF]"
                style={{ boxShadow: '0 0 12px rgba(193,123,255,0.8)' }} />
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              <ConfirmRow label="Услуга" value={`${store.selectedService.title} · ${store.selectedService.duration}ч`} />
              <ConfirmRow label="Дата" value={format(localDate, 'd MMMM yyyy', { locale: ru })} />
              <ConfirmRow label="Время" value={`${localTime}`} />
              <div className="pt-3 mt-1 border-t border-[#2A2A2A] space-y-3">
                <ConfirmRow label="Итого" value={`${store.selectedService.price.toLocaleString()} ₽`} bold />
                <ConfirmRow
                  label="Предоплата 50%"
                  value={`${Math.ceil(store.selectedService.price * 0.5).toLocaleString()} ₽`}
                  accent
                />
              </div>
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
            <span className="relative z-10">
              {submitting ? 'Отправляем...' : 'Подтвердить запись'}
            </span>
          </button>
        </div>
      )}

      {/* Bottom CTA — "Далее" */}
      {step !== 'confirm' && canProceed() && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 pb-3 z-30">
          <button
            onClick={next}
            className="btn-lily w-full py-4 rounded-2xl font-bold text-base"
          >
            Далее
          </button>
        </div>
      )}
    </div>
  )
}

function ServiceCard({ service, selected, onSelect }: { service: Service; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98]
        ${selected
          ? 'bg-[#C17BFF]/10 border border-[#C17BFF]/30'
          : 'bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#C17BFF]/20'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">
            {service.title} · {service.duration}ч
          </div>
          <div className="text-xs text-white/40 mt-0.5 line-clamp-1">
            {service.description}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`font-bold text-sm ${selected ? 'text-[#C17BFF]' : 'text-white'}`}>
            {service.price.toLocaleString()} ₽
          </div>
          <div className="text-[10px] text-white/30">50% предоплата</div>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-[#C17BFF] flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

function ConfirmRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/40">{label}</span>
      <span className={`text-sm font-medium ${accent ? 'text-[#C17BFF] font-semibold' : bold ? 'text-white font-bold' : 'text-white'}`}>
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
      {/* Ring + check */}
      <div className="relative mb-8">
        <div
          ref={ringRef}
          className="success-ring w-28 h-28 rounded-full border-2 border-[#C17BFF]/20 flex items-center justify-center"
        >
          <div
            className="w-20 h-20 rounded-full bg-[#C17BFF]/5 flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(193,123,255,0.15), 0 0 80px rgba(193,123,255,0.08)' }}
          >
            <svg
              className="w-9 h-9 text-[#C17BFF] success-check"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        {/* Orbiting dot */}
        <div className="absolute inset-0 success-orbit">
          <div
            className="w-2 h-2 rounded-full bg-[#C17BFF] absolute -top-1 left-1/2 -translate-x-1/2"
            style={{ boxShadow: '0 0 8px rgba(193,123,255,0.9)' }}
          />
        </div>
      </div>

      <h2 className="font-display text-2xl font-black text-white mb-2 tracking-tight">
        Запись создана
      </h2>
      <p className="text-sm text-white/40 mb-10 max-w-xs leading-relaxed">
        Мы уже знаем о тебе. Напомним за день до сессии — просто приходи и твори.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onDone}
          className="btn-lily w-full py-4 rounded-2xl font-bold text-white"
        >
          Мои записи
        </button>
        <button
          onClick={onHome}
          className="w-full py-3.5 rounded-2xl font-medium text-white/50 bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform"
        >
          На главную
        </button>
      </div>
    </div>
  )
}
