import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Moon, Radio, Mic2 } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'
import { useBookingStore } from '../store/bookingStore'
import { useAppContext } from '../App'
import { getUserBookings, cancelBooking } from '../api'
import { SERVICES, STUDIOS } from '../data'
import type { Booking } from '../types'

const STATUS_LABELS: Record<Booking['status'], { label: string; color: string }> = {
  pending:   { label: 'Ожидает',      color: 'text-yellow-400' },
  confirmed: { label: 'Подтверждена', color: 'text-green-400' },
  completed: { label: 'Завершена',    color: 'text-white/30' },
  cancelled: { label: 'Отменена',     color: 'text-[#FF4B4B]' },
}

const APP_VERSION = '1.0.0'

export function Profile() {
  const { user } = useTelegram()
  const { telegramId } = useAppContext()
  const { myBookings } = useBookingStore()
  const navigate = useNavigate()
  const [apiBookings, setApiBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

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
  const history  = combined.filter(b => b.status === 'completed' || b.status === 'cancelled')

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId)
      setApiBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } catch {}
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* Header */}
      <div className="px-4 pt-6 pb-5">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">Личный кабинет</p>
        <h1 className="font-display text-2xl font-black text-white tracking-tight">Профиль</h1>
      </div>

      {/* User card */}
      <div className="mx-4 mb-6">
        <div className="card-lab p-4 flex items-center gap-4">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#C17BFF]/30"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C17BFF40, #C17BFF15)', boxShadow: '0 0 20px rgba(193,123,255,0.15)' }}
            >
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
          </div>
          {/* Lilac dot indicator */}
          <div className="w-2 h-2 rounded-full bg-[#C17BFF] flex-shrink-0"
            style={{ boxShadow: '0 0 8px rgba(193,123,255,0.7)' }} />
        </div>
      </div>

      {/* Upcoming */}
      <Section title="Предстоящие записи">
        {loading ? (
          <div className="text-center py-8 text-white/30 text-sm">Загружаем...</div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={<Mic2 size={36} strokeWidth={1} />}
            text="Нет активных записей"
            action="Записаться"
            onAction={() => navigate('/booking')}
          />
        ) : (
          upcoming.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)
        )}
      </Section>

      {history.length > 0 && (
        <Section title="История">
          {history.map(b => <BookingCard key={b.id} booking={b} />)}
        </Section>
      )}

      {/* Settings */}
      <Section title="Настройки">
        <div className="card-lab overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="text-sm text-white/40">Версия приложения</div>
            <div className="text-sm font-mono text-white/20">{APP_VERSION}</div>
          </div>
        </div>
      </Section>

      {/* Contacts */}
      <Section title="Контакты">
        <div className="card-lab overflow-hidden divide-y divide-[#2A2A2A]">
          <ContactRow icon={<Compass size={16} strokeWidth={1.5} />} label="Адрес" value="Гороховая 70, СПб" />
          <ContactRow icon={<Moon size={16} strokeWidth={1.5} />} label="Работаем" value="Круглосуточно" />
          <ContactRow icon={<Radio size={16} strokeWidth={1.5} />} label="Telegram" value="@laboratoriya" />
        </div>
      </Section>

    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 px-4">
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: (id: string) => void }) {
  const service = SERVICES.find(s => s.id === booking.serviceId)
  const studio  = STUDIOS.find(s => s.id === booking.studioId)
  const status  = STATUS_LABELS[booking.status]
  const isActive = booking.status === 'pending' || booking.status === 'confirmed'

  return (
    <div className="card-lab p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <div className="font-semibold text-white text-sm">
            {service?.title ?? booking.serviceId ?? '—'}{service?.duration ? ` · ${service.duration}ч` : ''}
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {studio?.name ?? (booking.studioId ? `Студия ${booking.studioId}` : '—')}
          </div>
        </div>
        <span className={`text-[11px] font-semibold flex-shrink-0 ${status.color}`}>{status.label}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {booking.date}
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {booking.time}
        </div>
        <div className="ml-auto font-semibold text-white text-sm">
          {Number(booking.totalPrice).toLocaleString()} ₽
        </div>
      </div>

      {isActive && onCancel && (
        <button
          onClick={() => onCancel(booking.id)}
          className="mt-3 text-xs text-[#FF4B4B]/70 hover:text-[#FF4B4B] transition-colors"
        >
          Отменить запись
        </button>
      )}
    </div>
  )
}

function EmptyState({ icon, text, action, onAction }: {
  icon: React.ReactNode
  text: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="py-10 text-center">
      <div className="flex justify-center text-white/20 mb-3">{icon}</div>
      <p className="text-sm text-white/30 mb-5">{text}</p>
      <button
        onClick={onAction}
        className="btn-lily px-7 py-2.5 rounded-xl text-sm font-semibold"
      >
        {action}
      </button>
    </div>
  )
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-[#C17BFF]/60">{icon}</span>
      <div>
        <div className="text-[10px] text-white/30 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-white mt-0.5">{value}</div>
      </div>
    </div>
  )
}
