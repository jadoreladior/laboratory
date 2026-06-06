const express = require('express')
const { readSheet, appendRow, findRow, updateRow, deleteRow, SHEET_COLUMNS } = require('../sheets')

const router = express.Router()

// GET /api/employees  — list + monthly salary preview
router.get('/', async (req, res, next) => {
  try {
    const [employees, leads] = await Promise.all([
      readSheet('Employees'),
      readSheet('Leads'),
    ])

    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const monthlyRevenue = leads
      .filter(l => l.status !== 'cancelled' && l.booking_date >= monthAgo)
      .reduce((s, l) => s + (Number(l.total_price) || 0), 0)

    const result = employees.map(e => ({
      ...e,
      salary_month: Math.round(monthlyRevenue * (Number(e.revenue_percent) || 0) / 100),
    }))

    res.json(result)
  } catch (err) { next(err) }
})

// POST /api/employees
router.post('/', async (req, res, next) => {
  try {
    const { name, telegram_id = '', role = 'Сотрудник', hourly_rate = 0, revenue_percent = 0 } = req.body
    if (!name) return res.status(400).json({ error: 'name — обязательное поле' })

    const id = Date.now().toString()
    const created_at = new Date().toISOString()

    const row = SHEET_COLUMNS.Employees.map(col => ({
      id, name, telegram_id, role, hourly_rate, revenue_percent, created_at,
    }[col] ?? ''))

    await appendRow('Employees', row)
    res.status(201).json({ id, name, telegram_id, role, hourly_rate, revenue_percent, created_at })
  } catch (err) { next(err) }
})

// PUT /api/employees/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, telegram_id = '', role = 'Сотрудник', hourly_rate = 0, revenue_percent = 0 } = req.body
    if (!name) return res.status(400).json({ error: 'name — обязательное поле' })

    const found = await findRow('Employees', 'id', req.params.id)
    if (!found) return res.status(404).json({ error: 'Сотрудник не найден' })

    const updated = { ...found.row, name, telegram_id, role, hourly_rate, revenue_percent }
    const values = SHEET_COLUMNS.Employees.map(col => updated[col] ?? '')
    await updateRow('Employees', found.rowNumber, values)

    res.json(updated)
  } catch (err) { next(err) }
})

// DELETE /api/employees/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const found = await findRow('Employees', 'id', req.params.id)
    if (!found) return res.status(404).json({ error: 'Сотрудник не найден' })

    await deleteRow('Employees', found.rowNumber)
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
