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
