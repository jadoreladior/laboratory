require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { ensureHeaders } = require('./sheets')

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

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'laboratoriya-crm' }))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 8000

app.listen(PORT, async () => {
  console.log(`🎛  Лаборатория CRM API → http://localhost:${PORT}`)
  await ensureHeaders()
})
