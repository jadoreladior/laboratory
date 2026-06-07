const express = require('express')
const { readSheet, appendRow, findRow, updateRow, SHEET_COLUMNS } = require('../sheets')

const router = express.Router()

const DEFAULTS = {
  record_rate:  '1690',
  studio_rate:  '2690',
  rent_rate:    '1360',
  package_3h:   '7970',
  package_5h:   '11970',
  package_6h:   '13970',
}

// GET /api/admin/settings — return all key-value pairs merged with defaults
router.get('/', async (req, res, next) => {
  try {
    const rows = await readSheet('Settings')
    const map = { ...DEFAULTS }
    for (const r of rows) {
      if (r.key) map[r.key] = r.value
    }
    res.json(map)
  } catch (err) { next(err) }
})

// POST /api/admin/settings — upsert key-value pairs (body: { key: value, ... })
router.post('/', async (req, res, next) => {
  try {
    const body = req.body ?? {}
    const rows = await readSheet('Settings')

    for (const [key, value] of Object.entries(body)) {
      const existing = rows.findIndex(r => r.key === key)
      if (existing !== -1) {
        // Update: row number = dataIndex + 2 (header offset)
        const rowNumber = existing + 2
        await updateRow('Settings', rowNumber, [key, String(value)])
        rows[existing].value = String(value)
      } else {
        await appendRow('Settings', [key, String(value)])
      }
    }

    // Return merged map
    const updated = { ...DEFAULTS }
    for (const r of rows) { if (r.key) updated[r.key] = r.value }
    for (const [k, v] of Object.entries(body)) updated[k] = String(v)

    res.json(updated)
  } catch (err) { next(err) }
})

module.exports = router
