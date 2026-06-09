import { useEffect, useState, useCallback } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
         getDay, isSameDay, isToday, isPast, parseISO, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Mic2, Lock, X, Users, UserPlus, Check, ChevronLeft, ChevronRight,
         Calendar, BarChart2, Ban, PlusCircle, Tag, Send, Handshake } from 'lucide-react'
import {
  getAdminBookings, confirmBooking, cancelBooking, updateLeadStatus,
  getClients, addClient, verifyOwnerPin, createBooking,
  getCalendarMonth, getCalendarDay, blockSlot, unblockSlot,
  getAdminStats, getSettings, saveSettings, getClientProfile,
  sendBroadcast, getBroadcastCount,
  getPartners, addPartner, deletePartner,
} from '../api'
import type { Lead, Client, DayData, DaySlot, CalendarDay, ClientProfile, Partner } from '../api'
import { SERVICES } from '../data'
import { useAppContext } from '../App'
import { OwnerDashboard } from './OwnerDashboard'

type View = 'dashboard' | 'calendar' | 'day' | 'bookings' | 'clients' | 'pin' | 'owner' | 'prices' | 'broadcast' | 'partners'
type FilterStatus = 'pending' | 'confirmed' | 'cancelled'
type SheetType = null | 'detail' | 'book-form' | 'block-form' | 'time-pick'

const SL: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'ожидает',      color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  confirmed: { label: 'подтверждена', color: 'text-green-400',  bg: 'bg-green-400/10' },
  completed: { label: 'завершена',    color: 'text-white/30',   bg: 'bg-white/5' },
  cancelled: { label: 'отменена',     color: 'text-[#FF4B4B]',  bg: 'bg-[#FF4B4B]/10' },
}

const today = format(new Date(), 'yyyy-MM-dd')

// ─── Main component ───────────────────────────────────────────────────────────

export function Admin() {
  const { refreshPending } = useAppContext()
  const [view,    setView]    = useState<View>('dashboard')
  const [bookings, setBookings] = useState<Lead[]>([])
  const [clients,  setClients]  = useState<Client[]>([])
  const [stats,    setStats]    = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [pin, setPin]           = useState('')
  const [pinError, setPinError] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  // calendar state
  const [calDate,    setCalDate]    = useState(new Date())
  const [monthData,  setMonthData]  = useState<CalendarDay[]>([])
  const [monthLoading, setMonthLoading] = useState(false)

  // day view state
  const [dayDate,   setDayDate]   = useState(today)
  const [dayData,   setDayData]   = useState<DayData | null>(null)
  const [dayLoading, setDayLoading] = useState(false)

  // slot action sheet
  const [sheet,      setSheet]      = useState<SheetType>(null)
  const [sheetSlot,  setSheetSlot]  = useState<DaySlot | null>(null)
  const [acting,     setActing]     = useState<string | null>(null)

  const [partners, setPartners] = useState<Partner[]>([])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getAdminBookings(), getClients(), getAdminStats(), getPartners()])
      .then(([b, c, s, p]) => { setBookings(b); setClients(c); setStats(s); setPartners(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Load month data when calendar view opens
  const loadMonth = useCallback((d: Date) => {
    setMonthLoading(true)
    getCalendarMonth(d.getFullYear(), d.getMonth() + 1)
      .then(r => setMonthData(r.days))
      .catch(() => setMonthData([]))
      .finally(() => setMonthLoading(false))
  }, [])

  useEffect(() => {
    if (view === 'calendar') loadMonth(calDate)
  }, [view, calDate, loadMonth])

  // Load day data when day view opens
  const loadDay = useCallback((date: string) => {
    setDayLoading(true)
    setDayData(null)
    getCalendarDay(date)
      .then(setDayData)
      .catch(() => {})
      .finally(() => setDayLoading(false))
  }, [])

  useEffect(() => {
    if (view === 'day') loadDay(dayDate)
  }, [view, dayDate, loadDay])

  // PIN handler
  const handlePinDigit = (d: string) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setPinError(false)
    if (next.length === 4) {
      setPinLoading(true)
      verifyOwnerPin(next)
        .then(() => { setView('owner'); setPin('') })
        .catch(() => { setPinError(true); setPin('') })
        .finally(() => setPinLoading(false))
    }
  }

  // Booking actions
  const handleConfirm = async (id: string) => {
    setActing(id)
    try {
      await confirmBooking(id)
      setBookings(p => p.map(b => b.id === id ? { ...b, status: 'confirmed' } : b))
      if (dayData) {
        setDayData(prev => prev ? {
          ...prev,
          slots: prev.slots.map(s => s.booking?.id === id
            ? { ...s, booking: { ...s.booking!, status: 'confirmed' } } : s)
        } : prev)
      }
      refreshPending()
    } catch {} finally { setActing(null) }
  }

  const handleCancel = async (id: string) => {
    setActing(id)
    try {
      await cancelBooking(id)
      setBookings(p => p.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
      if (dayData) {
        setDayData(prev => prev ? {
          ...prev,
          slots: prev.slots.map(s => s.booking?.id === id
            ? { ...s, status: 'free', booking: null } : s)
        } : prev)
      }
      setSheet(null)
      refreshPending()
    } catch {} finally { setActing(null) }
  }

  const handleComplete = async (id: string) => {
    setActing(id)
    try {
      await updateLeadStatus(id, 'completed')
      setBookings(p => p.map(b => b.id === id ? { ...b, status: 'completed' } : b))
      if (dayData) {
        setDayData(prev => prev ? {
          ...prev,
          slots: prev.slots.map(s => s.booking?.id === id
            ? { ...s, booking: { ...s.booking!, status: 'completed' } } : s)
        } : prev)
      }
      setSheet(null)
    } catch {} finally { setActing(null) }
  }

  // ── VIEWS ──────────────────────────────────────────────────────────────────

  if (view === 'owner') return <OwnerDashboard onBack={() => setView('dashboard')} />
  if (view === 'prices')     return <PricesView     onBack={() => setView('dashboard')} />
  if (view === 'broadcast')  return <BroadcastView  onBack={() => setView('dashboard')} />
  if (view === 'partners')   return <PartnersView   partners={partners} setPartners={setPartners} onBack={() => setView('dashboard')} />
  if (view === 'clients') return (
    <ClientsView clients={clients} setClients={setClients} onBack={() => setView('dashboard')} />
  )
  if (view === 'pin') return (
    <PinView
      pin={pin} pinError={pinError} pinLoading={pinLoading}
      onDigit={handlePinDigit}
      onBackspace={() => setPin(p => p.slice(0, -1))}
      onClose={() => { setView('dashboard'); setPin('') }}
    />
  )

  if (view === 'bookings') return (
    <BookingsView
      bookings={bookings} loading={loading}
      onConfirm={handleConfirm} onCancel={handleCancel} onComplete={handleComplete}
      acting={acting}
      onBack={() => setView('dashboard')}
      onRefresh={load}
    />
  )

  if (view === 'day') return (
    <DayView
      date={dayDate}
      data={dayData}
      loading={dayLoading}
      sheet={sheet}
      sheetSlot={sheetSlot}
      acting={acting}
      onBack={() => setView('calendar')}
      onAddNew={() => setSheet('time-pick')}
      onPickTime={(slot) => { setSheetSlot(slot); setSheet('book-form') }}
      onOpenSlot={(slot) => {
        setSheetSlot(slot)
        if (slot.status === 'booked') setSheet('detail')
        else if (slot.status === 'free') setSheet('book-form')
        else setSheet(null)
      }}
      onBlockSlot={(slot) => { setSheetSlot(slot); setSheet('block-form') }}
      onUnblock={async (slot) => {
        if (!slot.blocked) return
        setActing(slot.blocked.id)
        try {
          await unblockSlot(slot.blocked.id)
          setDayData(prev => prev ? {
            ...prev,
            slots: prev.slots.map(s => s.time === slot.time
              ? { ...s, status: 'free', blocked: null } : s),
            blocked_count: prev.blocked_count - 1,
            free_count: prev.free_count + 1,
          } : prev)
        } catch {} finally { setActing(null) }
      }}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onComplete={handleComplete}
      onCloseSheet={() => setSheet(null)}
      onBookCreated={() => {
        loadDay(dayDate)
        setSheet(null)
      }}
      onBlocked={(blocked) => {
        setDayData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            slots: prev.slots.map(s => s.time === blocked.time
              ? { ...s, status: 'blocked', blocked } : s),
            blocked_count: prev.blocked_count + 1,
            free_count: prev.free_count - 1,
          }
        })
        setSheet(null)
      }}
    />
  )

  if (view === 'calendar') return (
    <CalendarView
      calDate={calDate}
      monthData={monthData}
      loading={monthLoading}
      onBack={() => setView('dashboard')}
      onPrev={() => setCalDate(d => subMonths(d, 1))}
      onNext={() => setCalDate(d => addMonths(d, 1))}
      onDayClick={(dateStr) => {
        setDayDate(dateStr)
        setView('day')
      }}
    />
  )

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const pending   = bookings.filter(b => b.status === 'pending').length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const revenue7  = stats?.revenue?.week ?? 0
  const revenueMonth = stats?.revenue?.month ?? 0

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">
      <div className="px-4 pt-6 pb-5">
        <h1 className="font-bold text-2xl text-white tracking-tight">CRM</h1>
      </div>

      {/* Stats row */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-5">
        {[
          { label: 'Ожидают', value: pending, accent: pending > 0 ? 'text-yellow-400' : 'text-white' },
          { label: 'Подтверждены', value: confirmed, accent: 'text-green-400' },
          { label: 'Неделя ₽', value: `${(revenue7/1000).toFixed(0)}к`, accent: 'text-[#CC0066]' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card-lab p-3 text-center">
            <div className={`text-xl font-black ${accent}`}>{value}</div>
            <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Mini revenue bar — last 7 days */}
      {stats?.daily && stats.daily.length > 0 && (
        <div className="px-4 mb-5">
          <div className="card-lab p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-white/40">Выручка за 30 дней</p>
              <span className="text-sm font-bold text-white">{(revenueMonth/1000).toFixed(0)}к ₽</span>
            </div>
            <div className="flex items-end gap-0.5 h-12">
              {stats.daily.slice(-14).map((d: any) => {
                const max = Math.max(...stats.daily.map((x: any) => x.revenue), 1)
                const h = Math.max(4, Math.round((d.revenue / max) * 48))
                const isT = d.date === today
                return (
                  <div
                    key={d.date}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: h,
                      background: isT ? '#CC0066' : 'rgba(204,0,102,0.3)',
                    }}
                    title={`${d.date}: ${d.revenue.toLocaleString()} ₽`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main tiles */}
      <div className="px-4 grid grid-cols-2 gap-3 stagger">

        {/* Calendar */}
        <button
          onClick={() => setView('calendar')}
          className="card-lab p-5 text-left active:scale-95 transition-transform col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <Calendar size={22} className="text-[#CC0066]" />
            <span className="text-xs font-medium text-white/40">Сегодня</span>
          </div>
          <div className="font-bold text-white text-sm">Календарь записей</div>
          <div className="text-xs text-white/40 mt-0.5">Слоты, загрузка, управление</div>
        </button>

        {/* Bookings */}
        <button
          onClick={() => setView('bookings')}
          className="relative card-lab p-5 text-left active:scale-95 transition-transform"
        >
          {pending > 0 && (
            <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1 rounded-full bg-[#FF4B4B] text-white text-[10px] font-bold flex items-center justify-center">
              {pending}
            </span>
          )}
          <div className="mb-3"><Mic2 size={22} className="text-white/50" /></div>
          <div className="font-bold text-white text-sm">Заявки</div>
          <div className="text-xs text-white/40 mt-0.5">Список + статусы</div>
        </button>

        {/* Clients */}
        <button
          onClick={() => setView('clients')}
          className="card-lab p-5 text-left active:scale-95 transition-transform"
        >
          <div className="mb-3"><Users size={22} className="text-white/50" /></div>
          <div className="font-bold text-white text-sm">Клиенты</div>
          <div className="text-xs text-white/40 mt-0.5">{clients.length} в базе</div>
        </button>

        {/* Prices */}
        <button
          onClick={() => setView('prices')}
          className="card-lab p-5 text-left active:scale-95 transition-transform"
        >
          <div className="mb-3"><Tag size={22} className="text-white/50" /></div>
          <div className="font-bold text-white text-sm">Цены</div>
          <div className="text-xs text-white/40 mt-0.5">Ставки и пакеты</div>
        </button>

        {/* Broadcast */}
        <button
          onClick={() => setView('broadcast')}
          className="card-lab p-5 text-left active:scale-95 transition-transform"
        >
          <div className="mb-3"><Send size={22} className="text-white/50" /></div>
          <div className="font-bold text-white text-sm">Рассылка</div>
          <div className="text-xs text-white/40 mt-0.5">Сообщение клиентам</div>
        </button>

        {/* Partners */}
        <button
          onClick={() => setView('partners')}
          className="card-lab p-5 text-left active:scale-95 transition-transform col-span-2"
        >
          <div className="flex items-center gap-3 mb-1">
            <Handshake size={22} className="text-white/50" />
            <div className="font-bold text-white text-sm">Партнёры</div>
          </div>
          <div className="text-xs text-white/40">{partners.length > 0 ? `${partners.length} партнёра в базе` : 'Работали с нами'}</div>
        </button>

        {/* Owner mode */}
        <button
          onClick={() => setView('pin')}
          className="card-lab p-5 text-left active:scale-95 transition-transform col-span-2 border-[#CC0066]/10"
        >
          <div className="mb-3"><Lock size={22} className="text-[#CC0066]/60" /></div>
          <div className="font-bold text-white text-sm">Режим владельца</div>
          <div className="text-xs text-white/40 mt-0.5">Аналитика, сотрудники, экспорт</div>
        </button>
      </div>
    </div>
  )
}

// ─── Calendar month view ──────────────────────────────────────────────────────

function CalendarView({ calDate, monthData, loading, onBack, onPrev, onNext, onDayClick }: {
  calDate: Date
  monthData: CalendarDay[]
  loading: boolean
  onBack: () => void
  onPrev: () => void
  onNext: () => void
  onDayClick: (date: string) => void
}) {
  const year  = calDate.getFullYear()
  const month = calDate.getMonth() + 1

  const start = startOfMonth(calDate)
  const end   = endOfMonth(calDate)

  // Monday-first offset
  const startDow = (getDay(start) + 6) % 7
  const prefixDays = Array.from({ length: startDow }, (_, i) =>
    addDays(start, -(startDow - i))
  )
  const monthDays = eachDayOfInterval({ start, end })
  const totalCells = prefixDays.length + monthDays.length
  const suffixCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  const suffixDays = Array.from({ length: suffixCount }, (_, i) =>
    addDays(end, i + 1)
  )

  const allDays = [...prefixDays, ...monthDays, ...suffixDays]

  const dayMap: Record<string, CalendarDay> = {}
  for (const d of monthData) dayMap[d.date] = d

  const fillColor = (fp: number) => {
    if (fp >= 90) return '#FF4B4B'
    if (fp >= 60) return '#FB923C'
    if (fp >= 30) return '#FACC15'
    return '#4ADE80'
  }

  // Today's quick stats
  const todayKey = today
  const todayInfo = dayMap[todayKey]

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-display font-black text-white text-lg capitalize">
            {format(calDate, 'LLLL yyyy', { locale: ru })}
          </h1>
        </div>
        <div className="flex gap-1">
          <button onClick={onPrev} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
            <ChevronLeft size={16} className="text-white/60" />
          </button>
          <button onClick={onNext} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
            <ChevronRight size={16} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Today quick info */}
      {todayInfo && (
        <div className="mx-4 mb-4 card-lab p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#CC0066]/15 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-[#CC0066]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/40">Сегодня</div>
            <div className="text-sm font-semibold text-white">
              {todayInfo.booked_slots}/{todayInfo.total_slots} слотов · {todayInfo.revenue.toLocaleString()} ₽
            </div>
          </div>
          <button
            onClick={() => onDayClick(todayKey)}
            className="text-[#CC0066] text-xs font-semibold"
          >
            Открыть
          </button>
        </div>
      )}
      {!todayInfo && (
        <button
          onClick={() => onDayClick(todayKey)}
          className="mx-4 mb-4 card-lab p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CC0066]/15 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#CC0066]" />
            </div>
            <div>
              <div className="text-xs text-white/40">Сегодня</div>
              <div className="text-sm font-semibold text-white">Записей нет</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/20" />
        </button>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3 mb-1">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
          <div key={d} className="text-center text-[10px] text-white/25 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Загружаем...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1 px-3">
          {allDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = day.getMonth() === calDate.getMonth()
            const isTodayDay = isToday(day)
            const isPastDay = isPast(day) && !isTodayDay
            const info = dayMap[dateStr]

            return (
              <button
                key={idx}
                onClick={() => inMonth && onDayClick(dateStr)}
                disabled={!inMonth}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                  ${!inMonth ? 'opacity-0 pointer-events-none' : 'active:scale-90'}
                  ${isTodayDay ? 'ring-1 ring-[#CC0066]/60' : ''}
                  ${inMonth && !isTodayDay ? 'bg-[#1A1A1A]' : ''}
                  ${isTodayDay ? 'bg-[#CC0066]/10' : ''}
                `}
              >
                <span className={`text-sm font-bold leading-none
                  ${!inMonth ? 'text-white/10'
                  : isTodayDay ? 'text-[#CC0066]'
                  : isPastDay ? 'text-white/30'
                  : 'text-white'}`}
                >
                  {format(day, 'd')}
                </span>

                {/* Fill indicator */}
                {inMonth && info && info.booked_slots > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: Math.min(info.booked_slots, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ background: fillColor(info.fill_percent) }}
                      />
                    ))}
                    {info.booked_slots > 4 && (
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                    )}
                  </div>
                )}
                {inMonth && !info && !isPastDay && !isTodayDay && (
                  <div className="w-1 h-1 rounded-full bg-green-400/30 mt-1" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 px-4">
        {[
          { color: '#4ADE80', label: 'Свободно' },
          { color: '#FACC15', label: 'Частично' },
          { color: '#FB923C', label: 'Много' },
          { color: '#FF4B4B', label: 'Полная загрузка' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-white/30">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Day timeline view ────────────────────────────────────────────────────────

function DayView({
  date, data, loading, sheet, sheetSlot, acting,
  onBack, onOpenSlot, onBlockSlot, onUnblock,
  onConfirm, onCancel, onComplete,
  onCloseSheet, onBookCreated, onBlocked, onAddNew, onPickTime,
}: {
  date: string
  data: DayData | null
  loading: boolean
  sheet: SheetType
  sheetSlot: DaySlot | null
  acting: string | null
  onBack: () => void
  onOpenSlot: (slot: DaySlot) => void
  onBlockSlot: (slot: DaySlot) => void
  onUnblock: (slot: DaySlot) => void
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onComplete: (id: string) => void
  onCloseSheet: () => void
  onBookCreated: () => void
  onBlocked: (b: any) => void
  onAddNew: () => void
  onPickTime: (slot: DaySlot) => void
}) {
  const parsedDate = parseISO(date)
  const label = format(parsedDate, 'EEEE, d MMMM', { locale: ru })
  const isFutureOrToday = !isPast(parsedDate) || isToday(parsedDate)

  return (
    <div className="pb-nav bg-[#0E0E0E] min-h-screen relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <div className="flex-1">
          <div className="text-xs font-medium text-white/40">День</div>
          <h1 className="text-base font-bold text-white capitalize">{label}</h1>
        </div>
        {isFutureOrToday && (
          <button
            onClick={() => onAddNew()}
            className="w-9 h-9 rounded-full bg-[#CC0066]/20 border border-[#CC0066]/30 flex items-center justify-center"
          >
            <PlusCircle size={16} className="text-[#CC0066]" />
          </button>
        )}
      </div>

      {/* Stats bar */}
      {data && (
        <div className="px-4 mb-4">
          <div className="card-lab p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40">
                {data.booked_count} / {data.booked_count + data.blocked_count + data.free_count} слотов
              </span>
              <span className="text-sm font-semibold text-white">{data.revenue.toLocaleString()} ₽</span>
            </div>
            {/* Fill bar */}
            <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(((data.booked_count + data.blocked_count) / (data.booked_count + data.blocked_count + data.free_count)) * 100)}%`,
                  background: '#CC0066',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slot list */}
      <div className="px-4 space-y-2 animate-fade-in">
        {loading && (
          <div className="text-center py-12 text-white/30 text-sm">Загружаем слоты...</div>
        )}

        {!loading && data?.slots.map((slot) => (
          <SlotRow
            key={slot.time}
            slot={slot}
            acting={acting}
            isFuture={isFutureOrToday}
            onClick={() => {
              if (slot.status === 'booked') onOpenSlot(slot)
              else if (slot.status === 'free') onOpenSlot(slot)
            }}
            onBlock={() => onBlockSlot(slot)}
            onUnblock={() => onUnblock(slot)}
          />
        ))}
      </div>

      {/* Bottom sheet modal */}
      {sheet && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.55)' }}
            onClick={onCloseSheet}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div
              className="animate-slide-up pointer-events-auto w-full"
              style={{
                maxWidth: 480,
                maxHeight: '90svh',
                overflowY: 'auto',
                background: '#161616',
                border: '1px solid #2A2A2A',
                borderRadius: '24px 24px 0 0',
              }}
            >
              {/* drag handle */}
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-1" />

              {sheet === 'detail' && sheetSlot?.booking && (
                <BookingDetailSheet
                  booking={sheetSlot.booking}
                  acting={acting}
                  onConfirm={() => handleConf(sheetSlot.booking!.id)}
                  onCancel={() => handleCanc(sheetSlot.booking!.id)}
                  onComplete={() => handleComp(sheetSlot.booking!.id)}
                  onClose={onCloseSheet}
                />
              )}

              {sheet === 'book-form' && sheetSlot && (
                <QuickBookForm
                  date={date}
                  time={sheetSlot.time}
                  onClose={onCloseSheet}
                  onCreated={onBookCreated}
                />
              )}

              {sheet === 'time-pick' && (
                <TimePickSheet
                  slots={data?.slots ?? []}
                  onPick={onPickTime}
                  onClose={onCloseSheet}
                />
              )}

              {sheet === 'block-form' && sheetSlot && (
                <BlockSlotForm
                  date={date}
                  time={sheetSlot.time}
                  onClose={onCloseSheet}
                  onBlocked={onBlocked}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )

  function handleConf(id: string) { onConfirm(id) }
  function handleCanc(id: string) { onCancel(id) }
  function handleComp(id: string) { onComplete(id) }
}

// ─── Slot row component ───────────────────────────────────────────────────────

function SlotRow({ slot, acting, isFuture, onClick, onBlock, onUnblock }: {
  slot: DaySlot
  acting: string | null
  isFuture: boolean
  onClick: () => void
  onBlock: () => void
  onUnblock: () => void
}) {
  const st = slot.booking ? (SL[slot.booking.status] ?? SL.pending) : null
  const isActing = !!acting && slot.booking?.id === acting

  if (slot.status === 'blocked') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FF4B4B]/8 border border-[#FF4B4B]/20">
        <div className="w-12 flex-shrink-0 text-center">
          <span className="text-sm font-mono font-bold text-white/40">{slot.time}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Ban size={14} className="text-[#FF4B4B]/70 flex-shrink-0" />
          <span className="text-sm text-white/50">
            {slot.blocked?.reason || 'Заблокировано'}
          </span>
        </div>
        {isFuture && (
          <button
            onClick={onUnblock}
            disabled={!!acting}
            className="text-xs text-white/30 hover:text-white/60 flex-shrink-0 transition-colors disabled:opacity-40"
          >
            Разблок.
          </button>
        )}
      </div>
    )
  }

  if (slot.status === 'booked' && slot.booking) {
    const b = slot.booking
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98]
          ${st?.bg ?? 'bg-white/5'} border-${st?.color?.replace('text-','')}/20 border-white/5`}
      >
        <div className="w-12 flex-shrink-0 text-center">
          <span className="text-sm font-mono font-bold text-white/60">{slot.time}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold text-white truncate">{b.client_name || 'Клиент'}</div>
          <div className="text-xs text-white/40 truncate mt-0.5">
            {b.service} · {Number(b.total_price).toLocaleString()} ₽
          </div>
        </div>
        <span className={`text-[11px] font-semibold flex-shrink-0 ${st?.color}`}>
          {st?.label}
        </span>
        <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
      </button>
    )
  }

  // Free slot
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]">
      <div className="w-12 flex-shrink-0 text-center">
        <span className="text-sm font-mono font-bold text-white/20">{slot.time}</span>
      </div>
      <div className="flex-1 text-xs text-white/20">Свободно</div>
      {isFuture && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onClick}
            className="px-2.5 py-1.5 rounded-lg bg-[#CC0066]/15 text-[#CC0066] text-xs font-medium border border-[#CC0066]/20 active:scale-95"
          >
            + Добавить
          </button>
          <button
            onClick={onBlock}
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/25 active:scale-95"
          >
            <Ban size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Booking detail sheet ─────────────────────────────────────────────────────

function BookingDetailSheet({ booking, acting, onConfirm, onCancel, onComplete, onClose }: {
  booking: Lead & { client_profile?: any }
  acting: string | null
  onConfirm: () => void
  onCancel: () => void
  onComplete: () => void
  onClose: () => void
}) {
  const st      = SL[booking.status] ?? SL.pending
  const isActing = acting === booking.id
  const p       = (booking as any).client_profile ?? null

  const tgUrl = booking.username
    ? `https://t.me/${booking.username}`
    : booking.telegram_id
      ? `tg://user?id=${booking.telegram_id}`
      : null

  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-black text-white text-lg">Запись #{booking.id.slice(-4)}</h3>
        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>
          {st.label}
        </span>
      </div>

      {/* Client profile card */}
      <div className="card-lab p-4 mb-3">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-[#CC0066]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[#CC0066] font-bold text-lg">
              {(booking.client_name || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base">{booking.client_name || '—'}</div>
            {tgUrl && (
              <a
                href={tgUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#CC0066] text-xs font-medium"
              >
                {booking.username ? `@${booking.username}` : `TG: ${booking.telegram_id}`}
              </a>
            )}
          </div>
          {/* First visit badge */}
          {p?.is_first_visit && (
            <div className="px-2 py-1 rounded-full bg-[#CC0066]/15 border border-[#CC0066]/30 flex-shrink-0">
              <span className="text-[10px] font-bold text-[#CC0066] uppercase tracking-wider">Первый раз</span>
            </div>
          )}
        </div>

        {/* Client stats */}
        {p && !p.is_first_visit && (
          <div className="grid grid-cols-3 gap-2 mb-3 pt-2 border-t border-[#2A2A2A]">
            <div className="text-center">
              <div className="text-base font-black text-white">{p.total_bookings}</div>
              <div className="text-[10px] text-white/30">визитов</div>
            </div>
            <div className="text-center">
              <div className="text-base font-black text-white">{(p.total_spent/1000).toFixed(0)}к</div>
              <div className="text-[10px] text-white/30">потрачено ₽</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-semibold text-white">{p.first_visit ?? '—'}</div>
              <div className="text-[10px] text-white/30">первый визит</div>
            </div>
          </div>
        )}

        {/* Phone */}
        {p?.phone && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#2A2A2A]">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Тел.</span>
            <a href={`tel:${p.phone}`} className="text-sm text-white font-medium">{p.phone}</a>
          </div>
        )}
      </div>

      {/* Booking details */}
      <div className="card-lab p-4 space-y-2.5 mb-4">
        <Row label="Услуга" value={booking.service} />
        <Row label="Дата" value={booking.booking_date} />
        <Row label="Время" value={booking.booking_time} />
        <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
          <Row label="Итого" value={`${Number(booking.total_price).toLocaleString()} ₽`} bold />
          <Row label="Предоплата" value={`${Number(booking.prepay_amount).toLocaleString()} ₽`} accent />
        </div>
        {booking.notes && (
          <div className="pt-2 border-t border-[#2A2A2A]">
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Заметка</div>
            <div className="text-sm text-white/70">{booking.notes}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {booking.status === 'pending' && (
          <button onClick={onConfirm} disabled={isActing}
            className="btn-lily w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-50">
            {isActing ? '...' : '✓ Подтвердить'}
          </button>
        )}
        {booking.status === 'confirmed' && (
          <button onClick={onComplete} disabled={isActing}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-green-500/20 border border-green-500/30 disabled:opacity-50">
            {isActing ? '...' : '✓ Отметить как завершённую'}
          </button>
        )}
        {(booking.status === 'pending' || booking.status === 'confirmed') && (
          <button onClick={onCancel} disabled={isActing}
            className="w-full py-3 rounded-2xl font-medium text-[#FF4B4B] bg-[#FF4B4B]/10 border border-[#FF4B4B]/20 disabled:opacity-50">
            {isActing ? '...' : '✕ Отменить запись'}
          </button>
        )}
        <button onClick={onClose} className="w-full py-3 text-white/25 text-sm">Закрыть</button>
      </div>
    </div>
  )
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/40 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${accent ? 'text-[#CC0066] font-semibold' : bold ? 'text-white font-bold' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Quick booking form ───────────────────────────────────────────────────────

function QuickBookForm({ date, time, onClose, onCreated }: {
  date: string; time: string; onClose: () => void; onCreated: () => void
}) {
  const [svcId,    setSvcId]    = useState(SERVICES[0]?.id ?? '')
  const [name,     setName]     = useState('')
  const [username, setUsername] = useState('')
  const [tgId,     setTgId]     = useState('')
  const [duration, setDuration] = useState(1)
  const [price,    setPrice]    = useState(SERVICES[0]?.price ?? 0)
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  // Find unique base services (one per category for the top-level select)
  const BASE_SVCS = SERVICES.filter((s, i, arr) =>
    arr.findIndex(x => x.category === s.category) === i
  )
  const selectedBase = BASE_SVCS.find(s => {
    const picked = SERVICES.find(x => x.id === svcId)
    return s.category === picked?.category
  }) ?? BASE_SVCS[0]

  // Duration options for the selected category
  const durationOpts = SERVICES
    .filter(s => s.category === selectedBase?.category && s.duration > 0)
    .map(s => s.duration)
  const uniqueDurs = [...new Set(durationOpts)].sort((a, b) => a - b)

  // Price from catalog, or manual override
  const catalogSvc = SERVICES.find(s => s.category === selectedBase?.category && s.duration === duration)
  const catalogPrice = catalogSvc?.price ?? 0

  const inp = 'w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm placeholder-white/25 outline-none focus:ring-1 focus:ring-[#CC0066]/40 border border-[#2A2A2A]'

  // When category changes → reset duration and price
  const handleCategoryChange = (newSvcId: string) => {
    setSvcId(newSvcId)
    const base = BASE_SVCS.find(s => s.id === newSvcId)
    const durs = SERVICES.filter(s => s.category === base?.category && s.duration > 0).map(s => s.duration)
    const firstDur = Math.min(...durs) || 1
    setDuration(firstDur)
    const p = SERVICES.find(s => s.category === base?.category && s.duration === firstDur)?.price ?? 0
    setPrice(p)
  }

  // When duration changes → update price from catalog
  const handleDurationChange = (d: number) => {
    setDuration(d)
    const p = SERVICES.find(s => s.category === selectedBase?.category && s.duration === d)?.price ?? catalogPrice
    setPrice(p)
  }

  const serviceLabel = selectedBase
    ? `${selectedBase.title}${duration > 0 ? ` ${duration}ч` : ''}`
    : ''

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const finalPrice = Number(price) || 0
      await createBooking({
        client_name: name,
        telegram_id: tgId ? Number(tgId) : undefined,
        username:    username || undefined,
        service:     serviceLabel,
        booking_date: date,
        booking_time: time,
        duration_hours: duration,
        total_price:    finalPrice,
        prepay_amount:  Math.ceil(finalPrice * 0.5),
        notes,
      })
      onCreated()
    } catch {} finally { setSaving(false) }
  }

  return (
    <div className="px-5 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-black text-white text-lg">Новая запись</h3>
        <div className="px-3 py-1 rounded-full bg-[#CC0066]/15 text-[#CC0066] text-xs font-semibold border border-[#CC0066]/30">
          {time}
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        {/* Client info */}
        <input className={inp} placeholder="Имя клиента *" value={name}
          onChange={e => setName(e.target.value)} />
        <input className={inp} placeholder="@username (необязательно)" value={username}
          onChange={e => setUsername(e.target.value)} />
        <input className={inp} placeholder="Telegram ID (необязательно)" value={tgId}
          onChange={e => setTgId(e.target.value)} />

        {/* Service category */}
        <select
          className={`${inp} appearance-none`}
          value={svcId}
          onChange={e => handleCategoryChange(e.target.value)}
        >
          {BASE_SVCS.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>

        {/* Duration */}
        {uniqueDurs.length > 1 && (
          <div className="flex gap-2">
            {uniqueDurs.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => handleDurationChange(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  duration === d
                    ? 'bg-[#CC0066]/15 border-[#CC0066]/40 text-[#CC0066]'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-white/50'
                }`}
              >{d}ч</button>
            ))}
          </div>
        )}

        {/* Price */}
        <input className={inp} placeholder="Стоимость ₽ (необязательно)" type="number"
          inputMode="numeric"
          value={price || ''}
          onChange={e => setPrice(Number(e.target.value))} />

        {/* Notes */}
        <input className={inp} placeholder="Заметка" value={notes}
          onChange={e => setNotes(e.target.value)} />
      </div>

      {/* Summary line */}
      <div className="mb-4 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-white/40 flex justify-between">
        <span>{serviceLabel}</span>
        <span className="text-white/70 font-semibold">{price.toLocaleString()} ₽ · предоплата {Math.ceil(Number(price)*0.5).toLocaleString()} ₽</span>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          className="btn-lily w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Сохраняем...' : 'Создать запись'}
        </button>
        <button onClick={onClose} className="w-full py-3 text-white/30 text-sm">Отмена</button>
      </div>
    </div>
  )
}

// ─── Block slot form ──────────────────────────────────────────────────────────

function BlockSlotForm({ date, time, onClose, onBlocked }: {
  date: string; time: string; onClose: () => void; onBlocked: (b: any) => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleBlock = async () => {
    setSaving(true)
    try {
      const blocked = await blockSlot(date, time, reason || 'Перерыв')
      onBlocked(blocked)
    } catch {} finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm placeholder-white/25 outline-none focus:ring-1 focus:ring-[#FF4B4B]/40 border border-[#2A2A2A]'

  return (
    <div className="px-5 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-black text-white text-lg">Заблокировать слот</h3>
        <div className="px-3 py-1 rounded-full bg-[#FF4B4B]/15 text-[#FF4B4B] text-xs font-semibold border border-[#FF4B4B]/30">
          {time}
        </div>
      </div>
      <div className="mb-5">
        <input
          className={inp}
          placeholder="Причина (перерыв, техобслуживание...)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <button
          onClick={handleBlock}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl font-bold text-[#FF4B4B] bg-[#FF4B4B]/15 border border-[#FF4B4B]/30 disabled:opacity-40"
        >
          {saving ? 'Блокируем...' : '⛔ Заблокировать'}
        </button>
        <button onClick={onClose} className="w-full py-3 text-white/30 text-sm">Отмена</button>
      </div>
    </div>
  )
}

// ─── Bookings list view ───────────────────────────────────────────────────────

function BookingsView({ bookings, loading, onConfirm, onCancel, onComplete, acting, onBack, onRefresh }: {
  bookings: Lead[]
  loading: boolean
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onComplete: (id: string) => void
  acting: string | null
  onBack: () => void
  onRefresh: () => void
}) {
  const [filter, setFilter] = useState<FilterStatus>('pending')

  const changeFilter = (f: FilterStatus) => {
    setFilter(f)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = bookings
    .filter(b => b.status === filter)
    .sort((a, b) =>
      new Date(`${a.booking_date}T${a.booking_time}`).getTime() -
      new Date(`${b.booking_date}T${b.booking_time}`).getTime()
    )

  const counts = {
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <h1 className="font-display font-black text-white text-xl flex-1">Заявки</h1>
        <button onClick={onRefresh} className="text-[#CC0066]/60 text-xs">Обновить</button>
      </div>

      {/* Tab tiles */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-5">
        {([
          { id: 'pending',   label: 'Ожидают',      color: 'text-yellow-400' },
          { id: 'confirmed', label: 'Подтверждены', color: 'text-green-400' },
          { id: 'cancelled', label: 'Отменены',     color: 'text-[#FF4B4B]' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => changeFilter(t.id)}
            className={`py-3 rounded-2xl text-center transition-all active:scale-95
              ${filter === t.id ? 'bg-white/10 ring-1 ring-white/20' : 'card-lab'}`}
          >
            <div className={`text-xl font-black ${filter === t.id ? t.color : 'text-white'}`}>
              {counts[t.id]}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{t.label}</div>
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm">Загружаем...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">Заявок нет</div>
        ) : filtered.map(b => {
          const st = SL[b.status]
          const isActing = acting === b.id
          const tgLink = (b as any).username
            ? `https://t.me/${(b as any).username}`
            : (b as any).telegram_id ? `tg://user?id=${(b as any).telegram_id}` : null

          return (
            <div key={b.id} className="card-lab p-4">
              {/* Client row */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-[#CC0066]/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#CC0066] font-bold text-xs">
                    {(b.client_name || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{b.client_name || '—'}</div>
                  {tgLink && (
                    <a href={tgLink} target="_blank" rel="noreferrer"
                      className="text-xs text-[#CC0066]/70">
                      {b.username ? `@${b.username}` : `ID: ${(b as any).telegram_id}`}
                    </a>
                  )}
                </div>
                <span className={`text-[11px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full ${st?.color} ${st?.bg}`}>
                  {st?.label}
                </span>
              </div>

              {/* Booking info */}
              <div className="text-sm text-white/80 font-medium mb-1">{b.service}</div>
              <div className="flex items-center gap-3 text-xs text-white/30 mb-3">
                <span>{b.booking_date}</span>
                <span>·</span>
                <span>{b.booking_time}</span>
                <span className="ml-auto font-semibold text-white/70">
                  {Number(b.total_price).toLocaleString()} ₽
                </span>
              </div>

              {/* Actions */}
              {b.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => onConfirm(b.id)} disabled={isActing}
                    className="flex-1 py-2 rounded-xl bg-green-500/15 text-green-400 text-sm font-medium border border-green-500/20 disabled:opacity-40">
                    {isActing ? '...' : '✓ Подтвердить'}
                  </button>
                  <button onClick={() => onCancel(b.id)} disabled={isActing}
                    className="flex-1 py-2 rounded-xl bg-[#FF4B4B]/10 text-[#FF4B4B] text-sm font-medium border border-[#FF4B4B]/20 disabled:opacity-40">
                    {isActing ? '...' : '✕ Отменить'}
                  </button>
                </div>
              )}
              {b.status === 'confirmed' && (
                <div className="flex gap-2">
                  <button onClick={() => onComplete(b.id)} disabled={isActing}
                    className="flex-1 py-2 rounded-xl bg-green-500/15 text-green-400 text-sm font-medium border border-green-500/20 disabled:opacity-40">
                    {isActing ? '...' : '✓ Завершить'}
                  </button>
                  <button onClick={() => onCancel(b.id)} disabled={isActing}
                    className="flex-1 py-2 rounded-xl bg-[#FF4B4B]/10 text-[#FF4B4B] text-sm font-medium border border-[#FF4B4B]/20 disabled:opacity-40">
                    {isActing ? '...' : '✕ Отменить'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Clients view ─────────────────────────────────────────────────────────────

function ClientsView({ clients, setClients, onBack }: {
  clients: Client[]
  setClients: React.Dispatch<React.SetStateAction<Client[]>>
  onBack: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', username: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const c = await addClient({ name: form.name, username: form.username, phone: form.phone, notes: form.notes })
      setClients(prev => [c, ...prev])
      setForm({ name: '', phone: '', username: '', notes: '' })
      setShowForm(false)
    } catch {} finally { setSaving(false) }
  }

  const openProfile = (c: Client) => {
    setSelectedClient(c)
    setProfile(null)
    setProfileLoading(true)
    getClientProfile(c.id)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const inp = 'w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm placeholder-white/25 outline-none focus:ring-1 focus:ring-[#CC0066]/40 border border-[#2A2A2A]'

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <h1 className="font-display font-black text-white text-xl flex-1">Клиенты</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-9 h-9 rounded-full bg-[#CC0066]/15 border border-[#CC0066]/30 flex items-center justify-center"
        >
          <UserPlus size={15} className="text-[#CC0066]" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <input
          className={inp}
          placeholder="Поиск по имени, @username, телефону..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="px-4 mb-4">
          <div className="card-lab p-4 space-y-2.5">
            <p className="text-xs font-medium text-white/40">Новый клиент</p>
            <input className={inp} placeholder="Имя *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input className={inp} placeholder="Телефон" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <input className={inp} placeholder="@username" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            <input className={inp} placeholder="Заметка" value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd} disabled={saving || !form.name.trim()}
                className="flex-1 btn-lily py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-40">
                <Check size={14} /> {saving ? 'Сохраняем...' : 'Добавить'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="w-10 rounded-xl card-lab flex items-center justify-center text-white/40">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">
            {search ? 'Не найдено' : 'Клиентов пока нет'}
          </div>
        ) : filtered.map(c => (
          <button
            key={c.id}
            onClick={() => openProfile(c)}
            className="w-full card-lab p-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#CC0066]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[#CC0066] font-bold text-sm">{c.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">{c.name}</div>
                <div className="flex flex-wrap gap-x-3 mt-0.5">
                  {c.phone    && <span className="text-xs text-white/40">{c.phone}</span>}
                  {c.username && <span className="text-xs text-white/30">@{c.username}</span>}
                </div>
                {c.notes && <div className="text-xs text-white/25 mt-0.5 italic">{c.notes}</div>}
              </div>
              <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Profile modal */}
      {selectedClient && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSelectedClient(null)}
          />
          <div
            className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div
              className="animate-slide-up pointer-events-auto w-full"
              style={{
                maxWidth: 480,
                maxHeight: 'calc(100svh - env(safe-area-inset-top, 0px) - 80px)',
                overflowY: 'auto',
                background: '#161616',
                border: '1px solid #2A2A2A',
                borderRadius: '24px 24px 0 0',
              }}
            >
              {/* Drag handle */}
              <div className="sticky top-0 bg-[#161616] pt-3 pb-2 z-10">
                <div className="w-10 h-1 bg-white/15 rounded-full mx-auto" />
              </div>

              <div className="px-5 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#CC0066]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#CC0066] font-black text-lg">{selectedClient.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-black text-white text-lg leading-tight">{selectedClient.name}</h3>
                      <div className="flex flex-wrap gap-x-3 mt-0.5">
                        {selectedClient.username && (
                          <a
                            href={`https://t.me/${selectedClient.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#CC0066]"
                          >
                            @{selectedClient.username}
                          </a>
                        )}
                        {selectedClient.phone && (
                          <a href={`tel:${selectedClient.phone}`} className="text-xs text-white/40">
                            {selectedClient.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0"
                  >
                    <X size={14} className="text-white/40" />
                  </button>
                </div>

                {profileLoading && (
                  <div className="text-center py-10 text-white/30 text-sm">Загружаем профиль...</div>
                )}

                {profile && !profileLoading && (
                  <>
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="card-lab p-3 text-center">
                        <div className="text-xl font-black text-white">{profile.total_bookings}</div>
                        <div className="text-[10px] text-white/30 mt-0.5 leading-tight">визитов</div>
                      </div>
                      <div className="card-lab p-3 text-center">
                        <div className="text-xl font-black text-white">{profile.completed_bookings}</div>
                        <div className="text-[10px] text-white/30 mt-0.5 leading-tight">завершено</div>
                      </div>
                      <div className="card-lab p-3 text-center">
                        <div className="text-xl font-black text-[#CC0066]">
                          {profile.total_spent >= 1000
                            ? `${(profile.total_spent / 1000).toFixed(0)}к`
                            : `${profile.total_spent}`}
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5 leading-tight">потрачено ₽</div>
                      </div>
                    </div>

                    {/* Extra info */}
                    {(profile.preferred_service || profile.last_visit || profile.first_visit) && (
                      <div className="card-lab p-4 space-y-2.5 mb-4">
                        {profile.preferred_service && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/40">Любимая услуга</span>
                            <span className="text-xs font-semibold text-[#CC0066] text-right max-w-[60%] leading-snug">
                              {profile.preferred_service}
                            </span>
                          </div>
                        )}
                        {profile.first_visit && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/40">Первый визит</span>
                            <span className="text-xs font-medium text-white">{profile.first_visit}</span>
                          </div>
                        )}
                        {profile.last_visit && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/40">Последний визит</span>
                            <span className="text-xs font-medium text-white">{profile.last_visit}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Booking history */}
                    {profile.history.length > 0 ? (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-2">
                          История записей
                        </p>
                        <div className="space-y-2">
                          {profile.history.map(b => {
                            const st = SL[b.status] ?? SL.pending
                            return (
                              <div key={b.id} className="card-lab p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white leading-snug truncate">
                                      {b.service}
                                    </div>
                                    <div className="text-xs text-white/30 mt-0.5">
                                      {b.booking_date} · {b.booking_time}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>
                                      {st.label}
                                    </span>
                                    <span className="text-xs text-white/50">
                                      {Number(b.total_price).toLocaleString()} ₽
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-white/20 text-sm">Записей пока нет</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Prices view ─────────────────────────────────────────────────────────────

function PricesView({ onBack }: { onBack: () => void }) {
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    getSettings()
      .then(setPrices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, val: string) => setPrices(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await saveSettings(prices)
      setPrices(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {} finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm outline-none focus:ring-1 focus:ring-[#CC0066]/40 border border-[#2A2A2A]'

  const Field = ({ label, k }: { label: string; k: string }) => (
    <div>
      <p className="text-[11px] text-white/35 mb-1.5">{label}</p>
      <div className="relative">
        <input
          className={inp}
          type="number"
          inputMode="numeric"
          value={prices[k] ?? ''}
          onChange={e => set(k, e.target.value)}
          style={{ paddingRight: 36 }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 text-sm">₽</span>
      </div>
    </div>
  )

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-6 pb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <h1 className="font-display font-black text-white text-xl flex-1">Цены</h1>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500/20 text-green-400' : 'btn-lily text-white'} disabled:opacity-40`}
        >
          {saved ? '✓ Сохранено' : saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-white/20">Загружаем...</div>
      ) : (
        <div className="px-4 space-y-5">
          {/* Hourly rates */}
          <div className="card-lab p-4 space-y-3.5">
            <p className="text-xs font-medium text-white/40">Почасовые ставки</p>
            <Field label="Запись (со звукорежиссёром)" k="record_rate" />
            <Field label="Сведение (почасово)" k="studio_rate" />
            <Field label="Аренда (без звукорежиссёра)" k="rent_rate" />
          </div>

          {/* Packages */}
          <div className="card-lab p-4 space-y-3.5">
            <p className="text-xs font-medium text-white/40">Пакеты «Готовый трек»</p>
            <Field label="3 часа" k="package_3h" />
            <Field label="5 часов" k="package_5h" />
            <Field label="6 часов" k="package_6h" />
          </div>

          <p className="text-xs text-white/20 text-center px-4">
            Цены обновятся сразу после сохранения и будут видны всем пользователям
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Time pick sheet ─────────────────────────────────────────────────────────

function TimePickSheet({ slots, onPick, onClose }: {
  slots: DaySlot[]
  onPick: (slot: DaySlot) => void
  onClose: () => void
}) {
  const free = slots.filter(s => s.status === 'free')
  return (
    <div className="px-5 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-black text-white text-lg">Выбери время</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <X size={14} className="text-white/40" />
        </button>
      </div>
      {free.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-6">Нет свободных слотов</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {free.map(slot => (
            <button
              key={slot.time}
              onClick={() => onPick(slot)}
              className="py-3 rounded-xl bg-[#CC0066]/10 border border-[#CC0066]/25 text-[#CC0066] font-semibold text-sm active:scale-95 transition-transform"
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Partners view ────────────────────────────────────────────────────────────

function PartnersView({ partners, setPartners, onBack }: {
  partners: Partner[]
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>
  onBack: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', role: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const inp = 'w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm placeholder-white/25 outline-none focus:ring-1 focus:ring-[#CC0066]/40 border border-[#2A2A2A]'

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const p = await addPartner(form.name, form.role)
      setPartners(prev => [...prev, p])
      setForm({ name: '', role: '' })
      setShowForm(false)
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deletePartner(id)
      setPartners(prev => prev.filter(p => p.id !== id))
    } catch {} finally { setDeletingId(null) }
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <h1 className="font-display font-black text-white text-xl flex-1">Партнёры</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-9 h-9 rounded-full bg-[#CC0066]/15 border border-[#CC0066]/30 flex items-center justify-center"
        >
          <UserPlus size={15} className="text-[#CC0066]" />
        </button>
      </div>

      {showForm && (
        <div className="px-4 mb-4">
          <div className="card-lab p-4 space-y-2.5">
            <p className="text-xs font-medium text-white/40">Новый партнёр</p>
            <input className={inp} placeholder="Название / Имя *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input className={inp} placeholder="Роль (студия, агентство, продакшн...)" value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd} disabled={saving || !form.name.trim()}
                className="flex-1 btn-lily py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-40">
                <Check size={14} /> {saving ? 'Сохраняем...' : 'Добавить'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="w-10 rounded-xl card-lab flex items-center justify-center text-white/40">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-2">
        {partners.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-white/15 mb-4">
              <Handshake size={48} className="mx-auto" />
            </div>
            <p className="text-white/30 text-sm mb-5">Партнёров пока нет</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-lily px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              Добавить партнёра
            </button>
          </div>
        ) : partners.map(p => (
          <div key={p.id} className="card-lab p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#CC0066]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[#CC0066] font-bold text-sm">{p.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm">{p.name}</div>
              {p.role && <div className="text-xs text-white/40 mt-0.5">{p.role}</div>}
            </div>
            <button
              onClick={() => handleDelete(p.id)}
              disabled={deletingId === p.id}
              className="w-8 h-8 rounded-xl bg-[#FF4B4B]/10 flex items-center justify-center text-[#FF4B4B]/70 hover:text-[#FF4B4B] transition-colors disabled:opacity-40 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PIN view ─────────────────────────────────────────────────────────────────

function PinView({ pin, pinError, pinLoading, onDigit, onBackspace, onClose }: {
  pin: string; pinError: boolean; pinLoading: boolean
  onDigit: (d: string) => void; onBackspace: () => void; onClose: () => void
}) {
  return (
    <div className="pb-nav flex flex-col bg-[#0E0E0E] min-h-screen">
      <div className="flex justify-end px-5 pt-5">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full card-lab flex items-center justify-center"
        >
          <X size={15} className="text-white/40" />
        </button>
      </div>

      <div className="flex flex-col items-center flex-1 justify-center pb-6">
        <img src="/assets/logo-laba.png" alt="logo"
          className="w-20 h-20 object-contain mb-4"
          style={{ filter: 'drop-shadow(0 0 20px rgba(204,0,102,0.5))' }}
        />
        <h2 className="font-display font-black text-white text-xl mb-1">
          Лаборатория
        </h2>
        <p className="text-xs font-medium text-white/40 mb-8">Режим владельца</p>

        {/* PIN dots */}
        <div className="flex gap-4 mb-2">
          {[0,1,2,3].map(i => {
            const filled = pin.length > i
            return (
              <div key={i} className="w-3.5 h-3.5 rounded-full transition-all duration-150"
                style={{
                  background: pinError && filled ? '#FF4B4B' : filled ? '#CC0066' : 'transparent',
                  border: `1.5px solid ${pinError && filled ? '#FF4B4B' : filled ? '#CC0066' : 'rgba(255,255,255,0.2)'}`,
                  boxShadow: filled && !pinError ? '0 0 10px rgba(204,0,102,0.5)' : 'none',
                }}
              />
            )
          })}
        </div>
        <div className="h-5 flex items-center">
          {pinError   && <p className="text-xs text-[#FF4B4B]">Неверный PIN</p>}
          {pinLoading && <p className="text-xs text-white/30">Проверяем...</p>}
        </div>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 px-8 pb-8">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => {
          if (d === '') return <div key={i} />
          const isBs = d === '⌫'
          return (
            <button
              key={i}
              disabled={pinLoading}
              onClick={() => isBs ? onBackspace() : onDigit(d)}
              className="h-16 rounded-2xl text-center text-2xl font-light text-white transition-all active:scale-90 disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Broadcast view ───────────────────────────────────────────────────────────

function BroadcastView({ onBack }: { onBack: () => void }) {
  const [message,    setMessage]    = useState('')
  const [audience,   setAudience]   = useState<'all' | 'with_bookings'>('all')
  const [count,      setCount]      = useState<number | null>(null)
  const [sending,    setSending]    = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result,     setResult]     = useState<{ sent: number; failed: number } | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)

  useEffect(() => {
    setLoadingCount(true)
    setResult(null)
    setConfirming(false)
    getBroadcastCount(audience)
      .then(setCount)
      .catch(() => setCount(null))
      .finally(() => setLoadingCount(false))
  }, [audience])

  const handleSend = async () => {
    if (!message.trim() || sending) return
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    setSending(true)
    setResult(null)
    try {
      const r = await sendBroadcast(message, audience)
      setResult(r)
      if (r.sent > 0) setMessage('')
    } catch {
      alert('Ошибка при отправке')
    } finally {
      setSending(false)
    }
  }

  const chars = message.length
  const tooLong = chars > 4096

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-6 pb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-full card-lab flex items-center justify-center">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <h1 className="font-display font-black text-white text-xl flex-1">Рассылка</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="card-lab p-4">
          <p className="text-xs font-medium text-white/40 mb-3">Аудитория</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { val: 'all',           label: 'Все клиенты',      desc: 'Все в базе' },
              { val: 'with_bookings', label: 'С бронированием',  desc: 'Кто бронировал' },
            ] as const).map(opt => (
              <button
                key={opt.val}
                onClick={() => setAudience(opt.val)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  audience === opt.val
                    ? 'bg-[#CC0066]/10 border-[#CC0066]/40'
                    : 'bg-[#1A1A1A] border-[#2A2A2A]'
                }`}
              >
                <div className={`text-sm font-semibold ${audience === opt.val ? 'text-[#CC0066]' : 'text-white'}`}>{opt.label}</div>
                <div className="text-[11px] text-white/30 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-center text-sm text-white/40">
            {loadingCount ? 'Считаем...' : count !== null ? <><span className="text-white font-semibold">{count}</span> получателей</> : '—'}
          </div>
        </div>

        <div className="card-lab p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-white/40">Текст сообщения</p>
            <span className={`text-[11px] ${tooLong ? 'text-red-400' : 'text-white/25'}`}>{chars}/4096</span>
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Привет! У нас новые цены и акции..."
            rows={7}
            className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-[#CC0066]/40 leading-relaxed"
          />
          <p className="text-[10px] text-white/20 mt-2">
            Поддерживается HTML: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;a href="..."&gt;ссылка&lt;/a&gt;
          </p>
        </div>

        {result && (
          <div className={`p-4 rounded-2xl border text-center ${result.failed === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
            <div className="text-lg font-bold text-white">✓ Отправлено: {result.sent}</div>
            {result.failed > 0 && <div className="text-sm text-yellow-400 mt-1">Не доставлено: {result.failed}</div>}
          </div>
        )}

        {confirming ? (
          <div className="p-4 rounded-2xl border border-[#CC0066]/30 bg-[#CC0066]/5 text-center space-y-3">
            <p className="text-sm text-white/70">Отправить <span className="text-white font-semibold">{count ?? '?'}</span> получателям?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white/60 font-semibold text-sm">Отмена</button>
              <button onClick={handleSend} disabled={sending} className="flex-1 py-3 rounded-xl btn-lily font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                <Send size={15} /> {sending ? 'Отправляем...' : 'Отправить'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={!message.trim() || tooLong || sending || (count ?? 0) === 0}
            className="w-full btn-lily py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Send size={18} />
            {sending ? 'Отправляем...' : `Отправить${count ? ` · ${count}` : ''}`}
          </button>
        )}
      </div>
    </div>
  )
}

