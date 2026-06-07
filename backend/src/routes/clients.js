const express = require('express')
const { readSheet, appendRow, findRow, SHEET_COLUMNS } = require('../sheets')

const router = express.Router()

// GET /api/clients
router.get('/', async (req, res, next) => {
  try {
    const clients = await readSheet('Clients')
    clients.sort((a, b) => b.created_at.localeCompare(a.created_at))
    res.json(clients)
  } catch (err) { next(err) }
})

// GET /api/clients/:id/profile — profile stats for a specific client
router.get('/:id/profile', async (req, res, next) => {
  try {
    const { id } = req.params
    const [clients, leads] = await Promise.all([
      readSheet('Clients'),
      readSheet('Leads'),
    ])

    const client = clients.find(c => c.id === id)
    if (!client) return res.status(404).json({ error: 'Клиент не найден' })

    // Match bookings by telegram_id or by name
    const clientLeads = leads.filter(l => {
      if (client.telegram_id && l.telegram_id && String(l.telegram_id) === String(client.telegram_id)) return true
      if (client.name && l.client_name && l.client_name.toLowerCase().trim() === client.name.toLowerCase().trim()) return true
      return false
    })

    const completed = clientLeads.filter(l => l.status === 'completed')
    const totalSpent = completed.reduce((sum, l) => sum + (Number(l.total_price) || 0), 0)

    // Service frequency
    const svcCount = {}
    for (const l of clientLeads) {
      if (l.service) svcCount[l.service] = (svcCount[l.service] || 0) + 1
    }
    const preferredService = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    // Sort bookings by date desc
    const sorted = [...clientLeads].sort((a, b) =>
      (b.booking_date + b.booking_time).localeCompare(a.booking_date + a.booking_time)
    )
    const lastVisit = sorted.find(l => l.status === 'completed')?.booking_date ?? null
    const firstVisit = [...clientLeads]
      .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
      .find(l => l.status === 'completed')?.booking_date ?? null

    res.json({
      client,
      total_bookings: clientLeads.length,
      completed_bookings: completed.length,
      total_spent: totalSpent,
      preferred_service: preferredService,
      last_visit: lastVisit,
      first_visit: firstVisit,
      is_first_visit: clientLeads.length === 0,
      history: sorted.slice(0, 20),
    })
  } catch (err) { next(err) }
})

// POST /api/clients — add new or upsert by telegram_id
router.post('/', async (req, res, next) => {
  try {
    const { name, telegram_id, username = '', phone = '', email = '', notes = '' } = req.body
    if (!name) return res.status(400).json({ error: 'name — обязательное поле' })

    // Upsert: if telegram_id exists, skip
    if (telegram_id) {
      const found = await findRow('Clients', 'telegram_id', telegram_id)
      if (found) return res.json(found.row)
    }

    const id = Date.now().toString()
    const created_at = new Date().toISOString()

    const row = SHEET_COLUMNS.Clients.map(col => ({
      id, name, telegram_id: telegram_id ?? '', username,
      phone, email, notes, created_at,
    }[col] ?? ''))

    await appendRow('Clients', row)
    res.status(201).json({ id, name, telegram_id, username, phone, email, notes, created_at })
  } catch (err) { next(err) }
})

module.exports = router
