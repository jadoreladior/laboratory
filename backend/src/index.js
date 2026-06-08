require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const { ensureHeaders } = require('./sheets')
const { startReminderScheduler } = require('./reminders')
const { handleUpdate, registerWebhook } = require('./bot')

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/api/book',      require('./routes/book'))
app.use('/api/leads',     require('./routes/leads'))
app.use('/api/clients',   require('./routes/clients'))
app.use('/api/employees', require('./routes/employees'))
app.use('/api/stats',     require('./routes/stats'))
app.use('/api/slots',     require('./routes/slots'))
app.use('/api/blocked',   require('./routes/blocked'))
app.use('/api/calendar',  require('./routes/calendar'))
app.use('/api/role',      require('./routes/role'))
app.use('/api/admin/owner',    require('./routes/owner'))
app.use('/api/admin/export',   require('./routes/export'))
app.use('/api/admin/settings', require('./routes/settings'))
app.use('/api/admin/partners',   require('./routes/partners'))
app.use('/api/admin/broadcast',  require('./routes/broadcast'))

// ── Telegram webhook ───────────────────────────────────────────────────────
app.post('/api/bot', (req, res) => {
  res.sendStatus(200)           // always ack immediately
  handleUpdate(req.body).catch(() => {})
})

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'laboratoriya-crm' }))

// ── Serve React frontend (built with Vite) ────────────────────────────────────
const frontendDist = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 8000
const RENDER_URL = process.env.RENDER_EXTERNAL_URL
  ?? process.env.BACKEND_URL
  ?? 'https://laboratory-backend-xy2t.onrender.com'

app.listen(PORT, () => {
  console.log(`CRM API running on port ${PORT}`)
  ensureHeaders().catch(err =>
    console.warn('ensureHeaders failed (non-fatal):', err.message)
  )
  startReminderScheduler()
  registerWebhook(RENDER_URL)
})
