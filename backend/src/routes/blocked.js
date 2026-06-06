const express = require('express')
const { readSheet, appendRow, findRow, deleteRow, SHEET_COLUMNS } = require('../sheets')

const router = express.Router()

// GET /api/blocked/:date — заблокированные слоты на дату
router.get('/:date', async (req, res, next) => {
  try {
    const all = await readSheet('BlockedSlots')
    res.json(all.filter(b => b.date === req.params.date))
  } catch (err) { next(err) }
})

// POST /api/blocked — заблокировать слот
router.post('/', async (req, res, next) => {
  try {
    const { date, time, reason = '' } = req.body
    if (!date || !time) return res.status(400).json({ error: 'date и time обязательны' })

    const id = Date.now().toString()
    const created_at = new Date().toISOString()

    const row = SHEET_COLUMNS.BlockedSlots.map(col =>
      ({ id, date, time, reason, created_at }[col] ?? '')
    )

    await appendRow('BlockedSlots', row)
    res.status(201).json({ id, date, time, reason, created_at })
  } catch (err) { next(err) }
})

// DELETE /api/blocked/:id — разблокировать
router.delete('/:id', async (req, res, next) => {
  try {
    const found = await findRow('BlockedSlots', 'id', req.params.id)
    if (!found) return res.status(404).json({ error: 'Не найдено' })
    await deleteRow('BlockedSlots', found.rowNumber)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
