const express = require('express')
const { readSheet } = require('../sheets')
const { tgSend } = require('../notify')

const router = express.Router()

// POST /api/admin/broadcast
// body: { message, audience: 'all' | 'with_bookings' }
router.post('/', async (req, res, next) => {
  try {
    const { message, audience = 'all' } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Текст сообщения обязателен' })
    }

    const [leads, clients] = await Promise.all([
      readSheet('Leads'),
      readSheet('Clients'),
    ])

    const ids = new Set()

    // Собираем из клиентов
    if (audience === 'all') {
      for (const c of clients) {
        if (c.telegram_id) ids.add(String(c.telegram_id))
      }
    }

    // Собираем из лидов (у кого были бронирования)
    for (const l of leads) {
      if (!l.telegram_id) continue
      if (audience === 'with_bookings' && l.status === 'cancelled') continue
      ids.add(String(l.telegram_id))
    }

    // Убираем ID админов из рассылки чтобы они не спамились сами себе
    // (опционально — закомментируй если нужно)
    // const adminIds = (process.env.ADMIN_IDS ?? '').split(',').map(x => x.trim())
    // for (const id of adminIds) ids.delete(id)

    let sent = 0, failed = 0

    for (const id of ids) {
      try {
        await tgSend(id, message)
        sent++
      } catch {
        failed++
      }
      // Небольшая пауза чтобы не флудить Telegram API (30 msg/s лимит)
      if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1100))
    }

    res.json({ sent, failed, total: ids.size })
  } catch (err) { next(err) }
})

// GET /api/admin/broadcast/count?audience=all|with_bookings
// Предпросмотр: сколько получателей
router.get('/count', async (req, res, next) => {
  try {
    const { audience = 'all' } = req.query
    const [leads, clients] = await Promise.all([
      readSheet('Leads'),
      readSheet('Clients'),
    ])

    const ids = new Set()
    if (audience === 'all') {
      for (const c of clients) { if (c.telegram_id) ids.add(String(c.telegram_id)) }
    }
    for (const l of leads) {
      if (!l.telegram_id) continue
      if (audience === 'with_bookings' && l.status === 'cancelled') continue
      ids.add(String(l.telegram_id))
    }

    res.json({ count: ids.size })
  } catch (err) { next(err) }
})

module.exports = router
