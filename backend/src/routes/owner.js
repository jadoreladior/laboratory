const express = require('express')
const router  = express.Router()

// POST /api/admin/owner/verify
// Body: { pin: "1234" }
router.post('/verify', (req, res) => {
  const { pin } = req.body ?? {}
  const OWNER_PIN = process.env.OWNER_PIN ?? '1234'

  if (!pin || String(pin) !== String(OWNER_PIN)) {
    return res.status(401).json({ ok: false, error: 'Invalid PIN' })
  }

  res.json({ ok: true })
})

module.exports = router
