const express = require('express')
const { readSheet } = require('../sheets')

const router = express.Router()

const ALL_SLOTS = [
  '00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00',
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00',
  '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00',
]

// GET /api/slots/:date
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params
    const leads = await readSheet('Leads')

    const booked = new Set()
    for (const l of leads) {
      if (l.booking_date !== date) continue
      if (!['pending', 'confirmed'].includes(l.status)) continue
      const startH   = parseInt(l.booking_time?.split(':')[0] ?? '0', 10)
      const duration = Math.max(1, parseInt(l.duration_hours ?? '1', 10))
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
