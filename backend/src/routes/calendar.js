const express = require('express')
const { readSheet } = require('../sheets')
const { buildClientProfile } = require('../clientProfile')

const router = express.Router()

const ALL_SLOTS = [
  '00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00',
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00',
  '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00',
]
const TOTAL = ALL_SLOTS.length

// GET /api/calendar/day/:date
// Полный вид дня: слоты + брони с профилями клиентов + блокировки
router.get('/day/:date', async (req, res, next) => {
  try {
    const { date } = req.params

    const [allLeads, allBlocked, allClients] = await Promise.all([
      readSheet('Leads'),
      readSheet('BlockedSlots'),
      readSheet('Clients'),
    ])

    const dayLeads   = allLeads.filter(l => l.booking_date === date)
    const dayBlocked = allBlocked.filter(b => b.date === date)

    // Заполняем каждый слот диапазона (start + duration_hours)
    const bookedMap = {}
    for (const l of dayLeads) {
      if (!['pending', 'confirmed', 'completed'].includes(l.status)) continue
      const startH   = parseInt(l.booking_time?.split(':')[0] ?? '0', 10)
      const duration = Math.max(1, parseInt(l.duration_hours ?? '1', 10))
      for (let i = 0; i < duration; i++) {
        const h    = (startH + i) % 24
        const slot = `${String(h).padStart(2, '0')}:00`
        if (!bookedMap[slot]) bookedMap[slot] = l
      }
    }

    const blockedMap = {}
    for (const b of dayBlocked) blockedMap[b.time] = b

    const slots = ALL_SLOTS.map(time => {
      const booking = bookedMap[time] ?? null
      const block   = blockedMap[time] ?? null
      let status = 'free'
      if (block)   status = 'blocked'
      else if (booking) status = 'booked'

      // Обогащаем бронь профилем клиента
      let enriched = booking
      if (booking && booking.telegram_id) {
        const profile = buildClientProfile(booking.telegram_id, allLeads, allClients)
        enriched = { ...booking, client_profile: profile }
      }

      return { time, status, booking: enriched, blocked: block }
    })

    const revenue       = dayLeads.filter(l => l.status !== 'cancelled').reduce((s, l) => s + (Number(l.total_price) || 0), 0)
    const booked_count  = slots.filter(s => s.status === 'booked').length
    const blocked_count = slots.filter(s => s.status === 'blocked').length

    res.json({
      date, slots,
      booked_count, blocked_count,
      free_count: TOTAL - booked_count - blocked_count,
      revenue,
    })
  } catch (err) { next(err) }
})

// GET /api/calendar/month/:year/:month
// Обзор месяца — степень заполненности каждого дня
router.get('/month/:year/:month', async (req, res, next) => {
  try {
    const { year, month } = req.params
    const prefix = `${year}-${String(month).padStart(2, '0')}`

    const [allLeads, allBlocked] = await Promise.all([
      readSheet('Leads'),
      readSheet('BlockedSlots'),
    ])

    const monthLeads   = allLeads.filter(l => l.booking_date?.startsWith(prefix))
    const monthBlocked = allBlocked.filter(b => b.date?.startsWith(prefix))

    const dayMap = {}
    for (const l of monthLeads) {
      if (!l.booking_date || l.status === 'cancelled') continue
      if (!dayMap[l.booking_date]) {
        dayMap[l.booking_date] = { date: l.booking_date, booked_times: new Set(), revenue: 0, count: 0 }
      }
      const startH   = parseInt(l.booking_time?.split(':')[0] ?? '0', 10)
      const duration = Math.max(1, parseInt(l.duration_hours ?? '1', 10))
      for (let i = 0; i < duration; i++) {
        const h = (startH + i) % 24
        dayMap[l.booking_date].booked_times.add(`${String(h).padStart(2, '0')}:00`)
      }
      dayMap[l.booking_date].revenue += Number(l.total_price) || 0
      dayMap[l.booking_date].count++
    }

    const blockedByDay = {}
    for (const b of monthBlocked) {
      if (!b.date) continue
      blockedByDay[b.date] = (blockedByDay[b.date] || 0) + 1
    }

    const allDates = new Set([
      ...Object.keys(dayMap),
      ...Object.keys(blockedByDay),
    ])

    const days = [...allDates].map(date => {
      const d            = dayMap[date] ?? { booked_times: new Set(), revenue: 0, count: 0 }
      const booked_slots  = d.booked_times.size
      const blocked_slots = blockedByDay[date] || 0
      return {
        date,
        count:         d.count,
        revenue:       d.revenue,
        booked_slots,
        blocked_slots,
        total_slots:   TOTAL,
        fill_percent:  Math.round(((booked_slots + blocked_slots) / TOTAL) * 100),
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    res.json({ year: parseInt(year), month: parseInt(month), total_slots: TOTAL, days })
  } catch (err) { next(err) }
})

module.exports = router
