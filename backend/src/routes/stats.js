const express = require('express')
const { readSheet } = require('../sheets')

const router = express.Router()

const sum = (arr, key) => arr.reduce((s, x) => s + (Number(x[key]) || 0), 0)

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const [leads, employees] = await Promise.all([
      readSheet('Leads'),
      readSheet('Employees'),
    ])

    const today    = new Date().toISOString().slice(0, 10)
    const weekAgo  = new Date(Date.now() -  7 * 86400000).toISOString().slice(0, 10)
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const nonCancelled = leads.filter(l => l.status !== 'cancelled')

    const revenue = {
      today: sum(nonCancelled.filter(l => l.booking_date === today), 'total_price'),
      week:  sum(nonCancelled.filter(l => l.booking_date >= weekAgo), 'total_price'),
      month: sum(nonCancelled.filter(l => l.booking_date >= monthAgo), 'total_price'),
      total: sum(nonCancelled, 'total_price'),
    }

    // Status counts
    const statuses = {}
    for (const l of leads) {
      statuses[l.status] = (statuses[l.status] || 0) + 1
    }

    // By service (top 10)
    const svcMap = {}
    for (const l of nonCancelled) {
      if (!svcMap[l.service]) svcMap[l.service] = { title: l.service, count: 0, revenue: 0 }
      svcMap[l.service].count++
      svcMap[l.service].revenue += Number(l.total_price) || 0
    }
    const by_service = Object.values(svcMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Peak hours
    const hourMap = {}
    for (const l of leads) {
      const hour = l.booking_time?.slice(0, 2)
      if (hour) hourMap[hour] = (hourMap[hour] || 0) + 1
    }
    const peak_hours = Object.entries(hourMap)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour)

    // Daily for last 30 days
    const dayMap = {}
    for (const l of nonCancelled) {
      if (l.booking_date >= monthAgo) {
        if (!dayMap[l.booking_date]) dayMap[l.booking_date] = { date: l.booking_date, count: 0, revenue: 0 }
        dayMap[l.booking_date].count++
        dayMap[l.booking_date].revenue += Number(l.total_price) || 0
      }
    }
    const daily = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))

    // Unique clients
    const total_clients = new Set(leads.map(l => l.telegram_id).filter(Boolean)).size

    // By studio
    const studioMap = {}
    for (const l of nonCancelled) {
      const id = l.studio_id || 'A'
      if (!studioMap[id]) studioMap[id] = { id, count: 0, revenue: 0 }
      studioMap[id].count++
      studioMap[id].revenue += Number(l.total_price) || 0
    }
    const by_studio = Object.values(studioMap)

    // Employee salaries
    const employees_salaries = employees.map(e => ({
      ...e,
      hourly_rate: Number(e.hourly_rate) || 0,
      revenue_percent: Number(e.revenue_percent) || 0,
      salary_month: Math.round(revenue.month * (Number(e.revenue_percent) || 0) / 100),
    }))

    res.json({ revenue, statuses, by_service, by_studio, peak_hours, daily, total_clients, employees_salaries })
  } catch (err) { next(err) }
})

module.exports = router
