const https = require('https')

/**
 * Отправляет сообщение в Telegram через Bot API
 */
async function tgSend(chatId, text, extra = {}) {
  const token = process.env.BOT_TOKEN
  if (!token || !chatId) return

  const body = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  })

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
 * Форматирует дату для вывода: "15 июня"
 */
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  } catch {
    return dateStr
  }
}

/**
 * Рассчитывает время окончания
 */
function calcEnd(time, durationHours) {
  try {
    const [h, m] = time.split(':').map(Number)
    const endH = (h + Math.floor(durationHours)) % 24
    const endM = m || 0
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  } catch {
    return ''
  }
}

/**
 * Уведомляет всех владельцев/админов о новой записи
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

/**
 * Подтверждение клиенту сразу после бронирования
 */
async function notifyClient(booking) {
  if (!booking.telegram_id) return

  const dur = Number(booking.duration_hours) || 1
  const endTime = calcEnd(booking.booking_time, dur)
  const timeRange = endTime
    ? `${booking.booking_time} — ${endTime}`
    : booking.booking_time
  const dateStr = formatDate(booking.booking_date)

  const durLabel = dur === 1 ? '1 час'
    : dur < 5 ? `${dur} часа`
    : `${dur} часов`

  const text =
    `✅ <b>Запись подтверждена!</b>\n\n` +
    `🎵 ${booking.service}\n` +
    `📅 <b>${dateStr}</b> · ${timeRange} · ${durLabel}\n\n` +
    `📍 Большой Сампсониевский, 60Н\n` +
    `🚇 м. Выборгская · Круглосуточно\n\n` +
    `💰 Итого: <b>${Number(booking.total_price).toLocaleString('ru-RU')} ₽</b>\n` +
    `💳 Предоплата: <b>${Number(booking.prepay_amount).toLocaleString('ru-RU')} ₽</b>\n\n` +
    `🔔 За 6 часов до сессии пришлём напоминание\n\n` +
    `До встречи в студии! 🎤`

  await tgSend(booking.telegram_id, text)
}

/**
 * Напоминание клиенту за 6 часов до сессии
 */
async function sendReminder(booking) {
  if (!booking.telegram_id) return

  const dur = Number(booking.duration_hours) || 1
  const endTime = calcEnd(booking.booking_time, dur)
  const timeRange = endTime
    ? `${booking.booking_time} — ${endTime}`
    : booking.booking_time
  const dateStr = formatDate(booking.booking_date)

  const text =
    `🔔 <b>Напоминание: сессия через 6 часов!</b>\n\n` +
    `🎵 ${booking.service}\n` +
    `📅 <b>Сегодня, ${dateStr}</b> · ${timeRange}\n\n` +
    `📍 Большой Сампсониевский, 60Н\n` +
    `🚇 м. Выборгская · напротив БЦ «Сигма»\n\n` +
    `Ждём тебя! Если возникнут вопросы — напиши нам 🎤`

  await tgSend(booking.telegram_id, text)
}

/**
 * Уведомление клиенту при изменении статуса админом
 */
async function notifyStatusChange(booking, newStatus) {
  if (!booking.telegram_id) return

  const dur = Number(booking.duration_hours) || 1
  const endTime = calcEnd(booking.booking_time, dur)
  const timeRange = endTime
    ? `${booking.booking_time} — ${endTime}`
    : booking.booking_time
  const dateStr = formatDate(booking.booking_date)

  let text = ''

  if (newStatus === 'confirmed') {
    text =
      `✅ <b>Запись подтверждена!</b>\n\n` +
      `🎵 ${booking.service}\n` +
      `📅 <b>${dateStr}</b> · ${timeRange}\n\n` +
      `📍 Большой Сампсониевский, 60Н\n` +
      `🚇 м. Выборгская · Круглосуточно\n\n` +
      `💰 Итого: <b>${Number(booking.total_price).toLocaleString('ru-RU')} ₽</b>\n` +
      `💳 Предоплата: <b>${Number(booking.prepay_amount).toLocaleString('ru-RU')} ₽</b>\n\n` +
      `🔔 За 6 часов до сессии пришлём напоминание\n\n` +
      `Ждём тебя в студии! 🎤`
  } else if (newStatus === 'cancelled') {
    text =
      `❌ <b>Запись отменена</b>\n\n` +
      `К сожалению, ваша запись на <b>${dateStr}</b> (${timeRange}) была отменена.\n\n` +
      `Если есть вопросы или хотите перенести — напишите нам 🙏`
  } else {
    return // для других статусов не уведомляем
  }

  await tgSend(booking.telegram_id, text)
}

module.exports = { tgSend, notifyAdmins, notifyClient, sendReminder, notifyStatusChange }
