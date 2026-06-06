const express = require('express')
const { readSheet, appendRow, SHEET_COLUMNS } = require('../sheets')
const { buildClientProfile } = require('../clientProfile')
const { notifyAdmins } = require('../notify')

const router = express.Router()

// POST /api/book — создать новую заявку
router.post('/', async (req, res, next) => {
  try {
    const {
      client_name, telegram_id, username,
      service, booking_date, booking_time,
      duration_hours = 1, total_price = 0,
      prepay_amount = 0, notes = '',
    } = req.body

    if (!client_name || !service || !booking_date || !booking_time) {
      return res.status(400).json({
        error: 'client_name, service, booking_date, booking_time — обязательные поля',
      })
    }

    const id         = Date.now().toString()
    const created_at = new Date().toISOString()
    const status     = 'pending'

    const leadRow = SHEET_COLUMNS.Leads.map(col => ({
      id, client_name, telegram_id: telegram_id ?? '',
      username: username ?? '', service,
      booking_date, booking_time,
      duration_hours, total_price, prepay_amount,
      status, notes, created_at,
    }[col] ?? ''))

    // Читаем обе таблицы параллельно
    const [, clients, leads] = await Promise.all([
      appendRow('Leads', leadRow),
      readSheet('Clients'),
      readSheet('Leads'),
    ])

    // Профиль клиента (на основе уже записанных данных до этого бронирования)
    const profile = telegram_id
      ? buildClientProfile(telegram_id, leads, clients)
      : { is_first_visit: true, total_bookings: 0, total_spent: 0, phone: null }

    // Auto-upsert клиента
    if (telegram_id) {
      const exists = clients.some(c => String(c.telegram_id) === String(telegram_id))
      if (!exists) {
        const clientId  = (Date.now() + 1).toString()
        const clientRow = SHEET_COLUMNS.Clients.map(col => ({
          id: clientId, name: client_name,
          telegram_id, username: username ?? '',
          phone: '', email: '', notes: '', created_at,
        }[col] ?? ''))
        await appendRow('Clients', clientRow)
      }
    }

    const booking = {
      id, client_name, telegram_id, username, service,
      booking_date, booking_time, duration_hours,
      total_price, prepay_amount, status, notes, created_at,
    }

    // Уведомление админам — не блокируем ответ
    notifyAdmins(booking, profile).catch(() => {})

    res.status(201).json({ ...booking, client_profile: profile })
  } catch (err) { next(err) }
})

module.exports = router
