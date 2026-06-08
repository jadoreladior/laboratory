/**
 * Telegram bot via webhook — registered automatically on startup.
 * Render wakes the service on each incoming POST, so no long-polling needed.
 */

const https = require('https')

const MINI_APP_URL = process.env.MINI_APP_URL
  ?? 'https://frontend-jadoreladiors-projects.vercel.app'

// ── Helpers ────────────────────────────────────────────────────────────────

function tgRequest(path, body) {
  const token = process.env.BOT_TOKEN
  if (!token) return Promise.resolve({})

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

// ── Process a single update (called by webhook route) ──────────────────────

async function handleUpdate(update) {
  try {
    const msg = update.message
    if (!msg) return
    const text = msg.text ?? ''
    if (text.startsWith('/start')) {
      await handleStart(msg.chat.id, msg.from?.first_name ?? 'друг')
    }
  } catch (e) {
    console.error('[bot] handleUpdate error:', e.message)
  }
}

// ── Register webhook on startup ────────────────────────────────────────────

async function registerWebhook(baseUrl) {
  if (!process.env.BOT_TOKEN) {
    console.log('[bot] BOT_TOKEN not set — bot disabled')
    return
  }
  const webhookUrl = `${baseUrl}/api/bot`
  const result = await tgRequest('/setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message'],
    drop_pending_updates: false,
  })
  if (result.ok) {
    console.log(`[bot] Webhook registered: ${webhookUrl}`)
  } else {
    console.warn('[bot] Webhook registration failed:', result.description)
  }
}

module.exports = { handleUpdate, registerWebhook }
