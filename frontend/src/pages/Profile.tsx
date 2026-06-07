import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic2 } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'
import { useBookingStore } from '../store/bookingStore'
import { useAppContext } from '../App'
import { getUserBookings, cancelBooking } from '../api'
import { SERVICES, STUDIOS } from '../data'
import type { Booking } from '../types'

const STATUS_LABELS: Record<Booking['status'], { label: string; color: string; dot: string }> = {
  pending:   { label: 'Ожидает',      color: 'text-yellow-400',   dot: 'bg-yellow-400' },
  confirmed: { label: 'Подтверждена', color: 'text-green-400',    dot: 'bg-green-400' },
  completed: { label: 'Завершена',    color: 'text-white/30',     dot: 'bg-white/20' },
  cancelled: { label: 'Отменена',     color: 'text-[#FF4B4B]',   dot: 'bg-[#FF4B4B]' },
}

export function Profile() {
  const { user } = useTelegram()
  const { telegramId } = useAppContext()
  const { myBookings } = useBookingStore()
  const navigate = useNavigate()
  const [apiBookings, setApiBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (!telegramId) return
    setLoading(true)
    getUserBookings(telegramId)
      .then((data: any[]) => {
        const mapped: Booking[] = data.map(b => ({
          id: String(b.id),
          studioId: b.studio_id,
          serviceId: b.service_id,
          date: b.booking_date,
          time: b.booking_time,
          totalPrice: b.total_price,
          prepayAmount: b.prepay_amount,
          status: b.status,
          createdAt: b.created_at,
        }))
        setApiBookings(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [telegramId])

  const allIds = new Set(apiBookings.map(b => b.id))
  const combined = [
    ...apiBookings,
    ...myBookings.filter(b => !allIds.has(b.id)),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const upcoming = combined.filter(b => b.status === 'pending' || b.status === 'confirmed')
  const past     = combined.filter(b => b.status === 'completed' || b.status === 'cancelled')

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId)
      setApiBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } catch {}
  }

  const displayList = tab === 'upcoming' ? upcoming : past

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">Личный кабинет</p>
        <h1 className="font-display text-2xl font-black text-white tracking-tight">Профиль</h1>
      </div>

      {/* User card */}
      <div className="mx-4 mt-4 mb-6">
        <div className="card-lab p-4 flex items-center gap-4">
          {user?.photo_url ? (
            <img src={user.photo_url} alt="avatar"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#C17BFF]/30" />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C17BFF40, #C17BFF15)', boxShadow: '0 0 20px rgba(193,123,255,0.15)' }}>
              <span className="text-[#C17BFF] font-bold text-xl">
                {user ? user.first_name[0] : '?'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base">
              {user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Гость'}
            </div>
            {user?.username && (
              <div className="text-sm text-white/40 mt-0.5">@{user.username}</div>
            )}
            <div className="text-xs text-white/25 mt-1">
              {upcoming.length > 0 ? `${upcoming.length} предстоящих` : 'Нет активных записей'}
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#C17BFF] flex-shrink-0"
            style={{ boxShadow: '0 0 8px rgba(193,123,255,0.7)' }} />
        </div>
      </div>

      {/* Bookings section */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Мои записи</p>
          <button onClick={() => navigate('/booking')}
            className="text-xs text-[#C17BFF] font-semibold">
            + Новая
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 p-1 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
          {(['upcoming', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === t
                  ? 'bg-[#2A2A2A] text-white'
                  : 'text-white/30'}`}
            >
              {t === 'upcoming'
                ? `Предстоящие${upcoming.length > 0 ? ` · ${upcoming.length}` : ''}`
                : `Прошлые${past.length > 0 ? ` · ${past.length}` : ''}`}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm">Загружаем...</div>
        ) : displayList.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex justify-center text-white/20 mb-3">
              <Mic2 size={40} strokeWidth={1} />
            </div>
            <p className="text-sm text-white/30 mb-5">
              {tab === 'upcoming' ? 'Нет активных записей' : 'История пуста'}
            </p>
            {tab === 'upcoming' && (
              <button onClick={() => navigate('/booking')}
                className="btn-lily px-7 py-2.5 rounded-xl text-sm font-semibold">
                Записаться
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={tab === 'upcoming' ? handleCancel : undefined} />
            ))}
          </div>
        )}
      </div>

      {/* Studio info */}
      <div className="px-4 mb-6">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Студия</p>
        <div className="card-lab overflow-hidden divide-y divide-[#2A2A2A]">
          <InfoRow emoji="📍" label="Адрес" value="Бол. Сампсониевский 60Н" />
          <InfoRow emoji="🕐" label="Работаем" value="Круглосуточно, 0:00 – 24:00" />
          <InfoRow emoji="💬" label="Telegram" value="@laboratoriya_spb" />
        </div>
      </div>

    </div>
  )
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: (id: string) => void }) {
  const service = SERVICES.find(s => s.id === booking.serviceId)
  const studio  = STUDIOS.find(s => s.id === booking.studioId)
  const status  = STATUS_LABELS[booking.status] ?? STATUS_LABELS.pending
  const isActive = booking.status === 'pending' || booking.status === 'confirmed'

  return (
    <div className={`card-lab p-4 ${isActive ? 'border-[#C17BFF]/15' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <div className="font-semibold text-white text-sm leading-tight">
            {service?.title ?? booking.serviceId ?? 'Запись'}{service?.duration ? ` · ${service.duration}ч` : ''}
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {studio?.name ?? 'Лаборатория'}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={`text-[11px] font-semibold flex-shrink-0 ${status.color}`}>{status.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {booking.date}
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {booking.time}
        </div>
        <div className="ml-auto font-bold text-white text-sm">
          {Number(booking.totalPrice).toLocaleString()} ₽
        </div>
      </div>

      {isActive && (
        <div className="mt-3 pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
          <span className="text-xs text-white/30">
            Предоплата: {Number(booking.prepayAmount).toLocaleString()} ₽
          </span>
          {onCancel && (
            <button onClick={() => onCancel(booking.id)}
              className="text-xs text-[#FF4B4B]/70 hover:text-[#FF4B4B] transition-colors">
              Отменить
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-lg flex-shrink-0">{emoji}</span>
      <div>
        <div className="text-[10px] text-white/30 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-white mt-0.5">{value}</div>
      </div>
    </div>
  )
}
