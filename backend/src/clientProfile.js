/**
 * Собирает полный профиль клиента:
 *   - данные из листа Clients (телефон, email)
 *   - история из Leads (всего визитов, потрачено, первый визит, последний визит)
 *
 * @param {string|number} telegramId
 * @param {object[]} allLeads   — уже прочитанный лист Leads (чтобы не делать лишний запрос)
 * @param {object[]} allClients — уже прочитанный лист Clients
 * @returns {object} profile
 */
function buildClientProfile(telegramId, allLeads, allClients) {
  const tid = String(telegramId ?? '').trim()

  const clientRow = allClients.find(c => String(c.telegram_id ?? '').trim() === tid) ?? null

  // История бронирований (всё, кроме отменённых)
  const history = tid
    ? allLeads.filter(l =>
        String(l.telegram_id ?? '').trim() === tid &&
        l.status !== 'cancelled'
      ).sort((a, b) => a.booking_date.localeCompare(b.booking_date))
    : []

  const total_bookings = history.length
  const total_spent    = history.reduce((s, l) => s + (Number(l.total_price) || 0), 0)
  const first_visit    = history[0]?.booking_date ?? null
  const last_visit     = history[history.length - 1]?.booking_date ?? null
  const is_first_visit = total_bookings === 0   // эта бронь будет первой

  return {
    phone:         clientRow?.phone     ?? null,
    email:         clientRow?.email     ?? null,
    notes:         clientRow?.notes     ?? null,
    total_bookings,
    total_spent,
    first_visit,
    last_visit,
    is_first_visit,
  }
}

module.exports = { buildClientProfile }
