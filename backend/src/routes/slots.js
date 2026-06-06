const express = require('express')
const { readSheet } = require('../sheets')

const router = express.Router()

const ALL_SLOTS = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']

// GET /api/slots/:date
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params
    const leads = await readSheet('Leads')

    const booked = new Set(
      leads
        .filter(l => l.booking_date === date && ['pending', 'confirmed'].includes(l.status))
        .map(l => l.booking_time)
    )

    res.json({
      date,
      slots: ALL_SLOTS.map(time => ({ time, available: !booked.has(time) })),
    })
  } catch (err) { next(err) }
})

module.exports = router
