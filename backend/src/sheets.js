const { google } = require('googleapis')
const path = require('path')

require('dotenv').config()

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

// Column definitions — order matters for row writes
const SHEET_COLUMNS = {
  Leads:        ['id','client_name','telegram_id','username','service','booking_date','booking_time','duration_hours','total_price','prepay_amount','status','notes','created_at'],
  Clients:      ['id','name','telegram_id','username','phone','email','notes','created_at'],
  Employees:    ['id','name','telegram_id','role','hourly_rate','revenue_percent','created_at'],
  BlockedSlots: ['id','date','time','reason','created_at'],
}

let _client = null

async function getSheetsClient() {
  if (_client) return _client

  let auth
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
      scopes: SCOPES,
    })
  } else {
    auth = new google.auth.GoogleAuth({
      keyFile: path.resolve(__dirname, '..', 'credentials.json'),
      scopes: SCOPES,
    })
  }

  _client = google.sheets({ version: 'v4', auth })
  return _client
}

const spreadsheetId = () => process.env.SPREADSHEET_ID

// Read all rows as array of objects (header row → keys)
async function readSheet(sheetName) {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${sheetName}!A:Z`,
  })
  const rows = res.data.values || []
  if (rows.length < 2) return []
  const [headers, ...data] = rows
  return data.map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
  )
}

// Append a new row (values array in SHEET_COLUMNS order)
async function appendRow(sheetName, values) {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

// Overwrite entire row (rowNumber = 1-based sheet row, including header)
async function updateRow(sheetName, rowNumber, values) {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${sheetName}!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

// Update a single cell by field name
async function updateField(sheetName, rowNumber, fieldName, value) {
  const colIndex = SHEET_COLUMNS[sheetName]?.indexOf(fieldName)
  if (colIndex == null || colIndex === -1) throw new Error(`Unknown field ${fieldName} in ${sheetName}`)
  const colLetter = String.fromCharCode(65 + colIndex)
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  })
}

// Delete a row by shifting rows up
async function deleteRow(sheetName, rowNumber) {
  const sheets = await getSheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() })
  const sheet = meta.data.sheets.find(s => s.properties.title === sheetName)
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`)

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      }],
    },
  })
}

// Find row: returns { row: object, rowNumber: number } or null
// rowNumber is 1-based sheet index (header=1, first data=2)
async function findRow(sheetName, fieldName, value) {
  const rows = await readSheet(sheetName)
  const idx = rows.findIndex(r => r[fieldName] === String(value))
  if (idx === -1) return null
  return { row: rows[idx], rowNumber: idx + 2, dataIndex: idx }
}

// Create a sheet tab if it doesn't exist
async function createSheet(sheetName) {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  })
  console.log(`✓ Sheet "${sheetName}" created`)
}

// Write headers to each sheet, creating the tab first if missing
async function ensureHeaders() {
  const sheets = await getSheetsClient()

  // Get list of existing sheet names
  const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() })
  const existing = new Set(meta.data.sheets.map(s => s.properties.title))

  for (const [sheetName, cols] of Object.entries(SHEET_COLUMNS)) {
    try {
      // Create tab if missing
      if (!existing.has(sheetName)) {
        await createSheet(sheetName)
      }

      // Write headers if first cell is wrong
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId(),
        range: `${sheetName}!A1:A1`,
      })
      const firstCell = res.data.values?.[0]?.[0]
      if (firstCell !== cols[0]) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [cols] },
        })
        console.log(`✓ Headers written to sheet "${sheetName}"`)
      }
    } catch (err) {
      console.warn(`⚠ Could not init sheet "${sheetName}":`, err.message)
    }
  }
}

module.exports = { SHEET_COLUMNS, readSheet, appendRow, updateRow, updateField, deleteRow, findRow, ensureHeaders }
