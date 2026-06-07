const express = require('express')
const { readSheet, appendRow, findRow, deleteRow } = require('../sheets')

const router = express.Router()

// GET /api/admin/partners
router.get('/', async (req, res, next) => {
  try {
    const rows = await readSheet('Partners')
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/admin/partners
router.post('/', async (req, res, next) => {
  try {
    const { name, role = '' } = req.body ?? {}
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })

    const id = Date.now().toString()
    const created_at = new Date().toISOString()
    await appendRow('Partners', [id, name.trim(), role.trim(), created_at])
    res.status(201).json({ id, name: name.trim(), role: role.trim(), created_at })
  } catch (err) { next(err) }
})

// DELETE /api/admin/partners/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const found = await findRow('Partners', 'id', req.params.id)
    if (!found) return res.status(404).json({ error: 'Not found' })
    await deleteRow('Partners', found.rowNumber)
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
