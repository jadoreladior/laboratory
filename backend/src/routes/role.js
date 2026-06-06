const express = require('express')
const { readSheet } = require('../sheets')

const router = express.Router()

// GET /api/role/:telegram_id
// Проверяет роль пользователя: owner / staff / user
router.get('/:telegram_id', async (req, res, next) => {
  try {
    const tid = String(req.params.telegram_id).trim()

    // Владельцы — из ENV
    const ownerIds = (process.env.ADMIN_IDS ?? '')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean)

    if (ownerIds.includes(tid)) {
      return res.json({ role: 'owner' })
    }

    // Сотрудники — из Google Sheets
    const employees = await readSheet('Employees')
    const emp = employees.find(e => String(e.telegram_id).trim() === tid)
    if (emp) return res.json({ role: 'staff', name: emp.name, employee_role: emp.role })

    return res.json({ role: 'user' })
  } catch (err) { next(err) }
})

module.exports = router
