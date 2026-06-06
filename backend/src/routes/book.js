const express = require('express')
const { readSheet, appendRow, SHEET_COLUMNS } = require('../sheets')

const router = express.Router()

// POST /api/book — create a new lead and auto-upsert the client
router.post('/', async (req, res, next) => {
  try {
    const {
      client_name, telegram_id, username,
      service, booking_date, booking_time,
      duration_hours = 1, total_price = 0,
      prepay_amount = 0, notes = '',
    } = req.body

    if (!client_name || !service || !booking_date || !booking_time) {
      return res.status(400).json({ error: 'client_name, service, booking_date, booking_time — обязательные поля' })
    }

    const id = Date.now().toString()
    const created_at = new Date().toISOString()
    const status = 'pending'

    const leadRow = SHEET_COLUMNS.Leads.map(col => ({
      id, client_name, telegram_id: telegram_id ?? '', username: username ?? '',
      service, booking_date, booking_time,
      duration_hours, total_price, prepay_amount,
      status, notes, created_at,
    }[col] ?? ''))

    await appendRow('Leads', leadRow)

    // Auto-upsert client
    if (telegram_id) {
      const clients = await readSheet('Clients')
      const exists = clients.some(c => c.telegram_id === String(telegram_id))
      if (!exists) {
        const clientId = (Date.now() + 1).toString()
        const clientRow = SHEET_COLUMNS.Clients.map(col => ({
          id: clientId, name: client_name,
          telegram_id, username: username ?? '',
          phone: '', email: '', notes: '', created_at,
        }[col] ?? ''))
        await appendRow('Clients', clientRow)
      }
    }

    res.status(201).json({ id, client_name, telegram_id, username, service, booking_date, booking_time, duration_hours, total_price, prepay_amount, status, notes, created_at })
  } catch (err) { next(err) }
})

module.exports = router
