/**
 * Minimal Telegram bot polling — runs inside the Express process on Render.
 * Handles /start → sends Mini App button.
 * No external service needed (Railway removed).
 */

const https = require('https')

const MINI_APP_URL = process.env.MINI_APP_URL
  ?? 'https://frontend-jadoreladiors-projects.vercel.app'

// ── Helpers ────────────────────────────────────────────────────────────────

function tgRequest(path, body) {
  const token = process.env.BOT_TOKEN
  if (!token) return Promise.resolve()

  const payload = body ? JSON.stringify(body) : null

  return new Promise(resolve => {
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}${path}`,
      method: payload ? 'POST' : 'GET',
    }
    if (payload) {
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      }
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve({}) }
      })
    })
    req.on('error', () => resolve({}))
    if (payload) req.write(payload)
    req.end()
  })
}

// ── Handlers ───────────────────────────────────────────────────────────────

async function handleStart(chatId, firstName) {
  await tgRequest('/sendMessage', {
    chat_id: chatId,
    text:
      `Привет, <b>${firstName}</b>! 🎛\n\n` +
      `Добро пожаловать в <b>Лаборатория</b> — профессиональную студию звукозаписи.\n\n` +
      `Запись, сведение, мастеринг, вокал — всё в одном месте.\n\n` +
      `Нажми кнопку ниже, чтобы выбрать услугу и записаться 👇`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{
        text: '🎛 Открыть Лаборатория',
        web_app: { url: MINI_APP_URL },
      }]],
    },
  })
}

// ── Polling loop ───────────────────────────────────────────────────────────

let _offset = 0

async function poll() {
  if (!process.env.BOT_TOKEN) return

  try {
    const data = await tgRequest(
      `/getUpdates?offset=${_offset}&timeout=20&allowed_updates=["message"]`
    )

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        _offset = update.update_id + 1
        const msg = update.message
        if (!msg) continue

        const text = msg.text ?? ''
        // /start (with or without deep-link payload)
        if (text.startsWith('/start')) {
          await handleStart(msg.chat.id, msg.from?.first_name ?? 'друг')
        }
      }
    }
  } catch (e) {
    // ignore, retry next cycle
  }

  // long-poll: after each response wait a bit then re-poll
  setTimeout(poll, 500)
}

function startBot() {
  if (!process.env.BOT_TOKEN) {
    console.log('[bot] BOT_TOKEN not set — bot disabled')
    return
  }
  console.log('[bot] Polling started')
  poll()
}

module.exports = { startBot }
