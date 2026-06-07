const express = require('express')
const { readSheet, updateField, findRow } = require('../sheets')
const { notifyStatusChange } = require('../notify')

const router = express.Router()

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

// GET /api/leads?status=&telegram_id=
router.get('/', async (req, res, next) => {
  try {
    let leads = await readSheet('Leads')

    if (req.query.status) {
      leads = leads.filter(l => l.status === req.query.status)
    }
    if (req.query.telegram_id) {
      leads = leads.filter(l => l.telegram_id === String(req.query.telegram_id))
    }

    leads.sort((a, b) => b.created_at.localeCompare(a.created_at))

    res.json(leads)
  } catch (err) { next(err) }
})

// PATCH /api/leads/:id  — { status }
router.patch('/:id', async (req, res, next) => {
  try {
    const { status } = req.body
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Статус должен быть одним из: ${VALID_STATUSES.join(', ')}` })
    }

    const found = await findRow('Leads', 'id', req.params.id)
    if (!found) return res.status(404).json({ error: 'Заявка не найдена' })

    const prevStatus = found.row.status
    await updateField('Leads', found.rowNumber, 'status', status)

    const updated = { ...found.row, status }

    // Авто-уведомление клиенту при смене статуса (confirmed / cancelled)
    if (status !== prevStatus && ['confirmed', 'cancelled'].includes(status)) {
      notifyStatusChange(updated, status).catch(err =>
        console.warn('[leads] notifyStatusChange failed:', err.message)
      )
    }

    res.json(updated)
  } catch (err) { next(err) }
})

module.exports = router
