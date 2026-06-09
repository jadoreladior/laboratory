const express = require('express')
const { readSheet } = require('../sheets')

const router = express.Router()

// GET /api/admin/export/bookings  — все записи CSV
router.get('/bookings', async (req, res, next) => {
  try {
    const leads = await readSheet('Leads')
    leads.sort((a, b) => b.created_at.localeCompare(a.created_at))

    const header = ['ID', 'Клиент', 'Telegram', 'Username', 'Услуга', 'Дата', 'Время', 'Длит.(ч)', 'Сумма', 'Предоплата', 'Статус', 'Заметка', 'Создано']
    const rows = leads.map(l => [
      l.id,
      l.client_name,
      l.telegram_id,
      l.username ? `@${l.username}` : '',
      l.service,
      l.booking_date,
      l.booking_time,
      l.duration_hours,
      l.total_price,
      l.prepay_amount,
      l.status,
      l.notes,
      l.created_at,
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))

    const csv = '﻿' + [header.join(','), ...rows].join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${new Date().toISOString().slice(0,10)}.csv"`)
    res.send(csv)
  } catch (err) { next(err) }
})

// GET /api/admin/export/financial  — финансовый отчёт CSV
router.get('/financial', async (req, res, next) => {
  try {
    const leads = await readSheet('Leads')
    const nonCancelled = leads.filter(l => l.status !== 'cancelled')
    nonCancelled.sort((a, b) => b.booking_date.localeCompare(a.booking_date))

    const header = ['Дата', 'Время', 'Услуга', 'Клиент', 'Длит.(ч)', 'Сумма (₽)', 'Предоплата (₽)', 'Статус']
    const rows = nonCancelled.map(l => [
      l.booking_date,
      l.booking_time,
      l.service,
      l.client_name,
      l.duration_hours,
      l.total_price,
      l.prepay_amount,
      l.status,
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))

    const csv = '﻿' + [header.join(','), ...rows].join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="financial-${new Date().toISOString().slice(0,10)}.csv"`)
    res.send(csv)
  } catch (err) { next(err) }
})

module.exports = router
