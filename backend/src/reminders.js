/**
 * Планировщик напоминаний за 6 часов до сессии.
 *
 * Работает через поллинг (каждые 5 минут) — устойчив к перезапускам Render.
 * Проверяет: есть ли бронирования, которые начнутся через 5.5–6.5 ч,
 * и которым напоминание ещё не отправлялось (смотрит в лист Reminders).
 */
const { readSheet, appendRow, SHEET_COLUMNS } = require('./sheets')
const { sendReminder } = require('./notify')

const POLL_INTERVAL_MS = 5 * 60 * 1000   // 5 минут
const WINDOW_MIN_H     = 5.5              // нижняя граница окна (часы)
const WINDOW_MAX_H     = 6.5             // верхняя граница окна (часы)

/**
 * Основная проверка — вызывается каждые 5 минут
 */
async function checkReminders() {
  try {
    const now = Date.now()

    // Читаем бронирования и уже отправленные напоминания
    const [leads, reminders] = await Promise.all([
      readSheet('Leads'),
      readSheet('Reminders'),
    ])

    const sentIds = new Set(reminders.map(r => r.booking_id))

    for (const booking of leads) {
      // Пропускаем отменённые и завершённые
      if (booking.status === 'cancelled' || booking.status === 'completed') continue
      // Пропускаем без telegram_id (некому слать)
      if (!booking.telegram_id) continue
      // Пропускаем уже отправленные
      if (sentIds.has(booking.id)) continue

      // Считаем время до начала сессии
      const sessionMs = parseSessionTime(booking.booking_date, booking.booking_time)
      if (!sessionMs) continue

      const hoursUntil = (sessionMs - now) / 3_600_000

      if (hoursUntil >= WINDOW_MIN_H && hoursUntil <= WINDOW_MAX_H) {
        console.log(`[reminders] Sending reminder for booking ${booking.id} (${hoursUntil.toFixed(1)}h until session)`)

        try {
          await sendReminder(booking)
          // Помечаем как отправлено
          const row = SHEET_COLUMNS.Reminders.map(col => ({
            booking_id: booking.id,
            sent_at: new Date().toISOString(),
          }[col] ?? ''))
          await appendRow('Reminders', row)
          sentIds.add(booking.id) // обновляем локальный Set
        } catch (err) {
          console.error(`[reminders] Failed to send reminder for ${booking.id}:`, err.message)
        }
      }
    }
  } catch (err) {
    console.error('[reminders] checkReminders error:', err.message)
  }
}

/**
 * Парсит дату и время сессии в миллисекунды (UTC+3 Москва / СПб)
 */
function parseSessionTime(dateStr, timeStr) {
  try {
    // dateStr: "2024-06-15", timeStr: "14:00"
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m||0).padStart(2,'0')}:00`)
    if (isNaN(d.getTime())) return null
    // Сервер на UTC — добавляем смещение МСК (UTC+3) если нужно
    // Если сервер уже в UTC, то Render возвращает UTC; переводим booking_time из МСК в UTC
    // Предполагаем, что booking_time задаётся в московском времени (UTC+3)
    return d.getTime() - 3 * 3_600_000
  } catch {
    return null
  }
}

/**
 * Запускает планировщик
 */
function startReminderScheduler() {
  console.log('[reminders] Scheduler started — polling every 5 minutes')
  // Первая проверка через 30 секунд после старта (не блокируем запуск сервера)
  setTimeout(() => {
    checkReminders()
    setInterval(checkReminders, POLL_INTERVAL_MS)
  }, 30_000)
}

module.exports = { startReminderScheduler }
