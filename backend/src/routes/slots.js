const express = require('express')
const { readSheet } = require('../sheets')

const router = express.Router()

// Working hours per category
const WORK_SLOTS = [
  '10:00','11:00','12:00','13:00','14:00','15:00',
  '16:00','17:00','18:00','19:00','20:00','21:00','22:00',
]
const ALL_24H = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

// GET /api/slots/:date?category=rent
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params
    const category = req.query.category ?? ''
    const ALL_SLOTS = category === 'rent' ? ALL_24H : WORK_SLOTS

    const leads = await readSheet('Leads')

    const booked = new Set()
    for (const l of leads) {
      if (l.booking_date !== date) continue
      if (!['pending', 'confirmed'].includes(l.status)) continue
      const startH   = parseInt(l.booking_time?.split(':')[0] ?? '0', 10)
      const dh = parseInt(l.duration_hours, 10)
      const duration = (isNaN(dh) || dh < 1) ? 1 : dh
      for (let i = 0; i < duration; i++) {
        const h = (startH + i) % 24
        booked.add(`${String(h).padStart(2, '0')}:00`)
      }
    }

    res.json({
      date,
      slots: ALL_SLOTS.map(time => ({ time, available: !booked.has(time) })),
    })
  } catch (err) { next(err) }
})

module.exports = router
