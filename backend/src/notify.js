const https = require('https')

/**
 * Отправляет сообщение в Telegram через Bot API
 */
async function tgSend(chatId, text) {
  const token = process.env.BOT_TOKEN
  if (!token) return

  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })

  return new Promise(resolve => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => { res.resume(); res.on('end', resolve) }
    )
    req.on('error', resolve)
    req.write(body)
    req.end()
  })
}

/**
 * Уведомляет всех владельцев о новой записи
 */
async function notifyAdmins(booking, profile) {
  const adminIds = (process.env.ADMIN_IDS ?? '')
    .split(',').map(x => x.trim()).filter(Boolean)
  if (adminIds.length === 0) return

  const tgLink = booking.username
    ? `@${booking.username}`
    : booking.telegram_id
      ? `<a href="tg://user?id=${booking.telegram_id}">ID ${booking.telegram_id}</a>`
      : '—'

  const visitLine = profile.is_first_visit
    ? '🆕 <b>ВПЕРВЫЕ У НАС</b>'
    : `🔄 Визит #${profile.total_bookings + 1} · потрачено ${profile.total_spent.toLocaleString('ru-RU')} ₽ всего`

  const phoneLine = profile.phone ? `\n📞 ${profile.phone}` : ''

  const text =
    `📋 <b>НОВАЯ ЗАПИСЬ</b>\n` +
    `${visitLine}\n\n` +
    `👤 <b>${booking.client_name}</b> · ${tgLink}${phoneLine}\n` +
    `🎵 ${booking.service}\n` +
    `📅 <b>${booking.booking_date}</b> · ${booking.booking_time}\n` +
    `💰 <b>${Number(booking.total_price).toLocaleString('ru-RU')} ₽</b>` +
    ` (предоплата ${Number(booking.prepay_amount).toLocaleString('ru-RU')} ₽)`

  await Promise.allSettled(adminIds.map(id => tgSend(id, text)))
}

module.exports = { notifyAdmins }
