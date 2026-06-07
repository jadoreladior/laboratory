/**
 * ЛАБОРАТОРИЯ — Стилизация Google Таблицы
 * ─────────────────────────────────────────
 * Как запустить:
 *   1. Открой Google Таблицу
 *   2. Расширения → Apps Script
 *   3. Вставь этот код (заменив всё что там есть)
 *   4. Нажми ▶ «Выполнить» → formatAll
 *   5. Разреши доступ при первом запуске
 */

function formatAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()

  // ── Цветовая палитра ──────────────────────────────────────────────────────
  const HEADER_BG  = '#5B21B6'   // фиолетовый заголовок
  const HEADER_FG  = '#FFFFFF'
  const ROW_ODD    = '#FFFFFF'
  const ROW_EVEN   = '#F5F0FF'   // очень светло-фиолетовый
  const BORDER_CLR = '#DDD6FE'

  // ── Конфигурация каждого листа ────────────────────────────────────────────
  const SHEETS = [
    {
      name: 'Leads',
      tabColor: '#6D28D9',
      widths:   [155, 160, 115, 130, 270, 105, 75, 100, 110, 115, 115, 200, 165],
      notes: [
        'ID записи',
        'Имя клиента',
        'Telegram ID',
        '@username в Telegram',
        'Услуга (что заказал)',
        'Дата сессии (ГГГГ-ММ-ДД)',
        'Время начала',
        'Длительность (часов)',
        'Итоговая сумма (₽)',
        'Предоплата (₽)',
        'Статус: pending / confirmed / completed / cancelled',
        'Заметки',
        'Дата создания заявки',
      ],
      statusCol: 11,  // колонка K — «status»
    },
    {
      name: 'Clients',
      tabColor: '#1D4ED8',
      widths:   [155, 170, 115, 130, 140, 190, 210, 165],
      notes: [
        'ID клиента',
        'Имя',
        'Telegram ID',
        '@username в Telegram',
        'Номер телефона',
        'Email',
        'Заметки о клиенте',
        'Дата регистрации',
      ],
    },
    {
      name: 'Employees',
      tabColor: '#047857',
      widths:   [155, 170, 115, 140, 120, 120, 165],
      notes: [
        'ID сотрудника',
        'Имя',
        'Telegram ID',
        'Роль (Звукорежиссёр / Менеджер…)',
        'Почасовая ставка (₽)',
        'Доля с выручки (%)',
        'Дата добавления',
      ],
    },
    {
      name: 'BlockedSlots',
      tabColor: '#B91C1C',
      widths:   [155, 115, 85, 230, 165],
      notes: [
        'ID',
        'Дата блокировки (ГГГГ-ММ-ДД)',
        'Время',
        'Причина',
        'Дата создания',
      ],
    },
    {
      name: 'Settings',
      tabColor: '#92400E',
      widths:   [230, 290],
      notes: [
        'Параметр (ключ)',
        'Значение',
      ],
    },
    {
      name: 'Partners',
      tabColor: '#BE185D',
      widths:   [155, 210, 160, 165],
      notes: [
        'ID',
        'Имя / псевдоним артиста',
        'Роль / жанр',
        'Дата добавления',
      ],
    },
    {
      name: 'Reminders',
      tabColor: '#0E7490',
      widths:   [155, 195],
      notes: [
        'ID заявки (которой отправили напоминание)',
        'Дата и время отправки напоминания',
      ],
    },
  ]

  for (const cfg of SHEETS) {
    const sheet = ss.getSheetByName(cfg.name)
    if (!sheet) {
      Logger.log(`Лист не найден: ${cfg.name}`)
      continue
    }

    const dataRows = sheet.getLastRow()
    const dataCols = Math.max(sheet.getLastColumn(), cfg.widths.length)

    // 1. Цвет вкладки
    sheet.setTabColor(cfg.tabColor)

    // 2. Высота строки-заголовка
    sheet.setRowHeight(1, 40)

    // 3. Стиль заголовка
    const hdr = sheet.getRange(1, 1, 1, dataCols)
    hdr
      .setBackground(HEADER_BG)
      .setFontColor(HEADER_FG)
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)

    // 4. Заморозить заголовок
    sheet.setFrozenRows(1)

    // 5. Ширины колонок
    cfg.widths.forEach((w, i) => {
      try { sheet.setColumnWidth(i + 1, w) } catch (_) {}
    })

    // 6. Русские подсказки (tooltip) на заголовках
    cfg.notes?.forEach((note, i) => {
      try { sheet.getRange(1, i + 1).setNote(note) } catch (_) {}
    })

    // 7. Чередующийся фон строк данных
    if (dataRows > 1) {
      for (let r = 2; r <= dataRows; r++) {
        sheet.getRange(r, 1, 1, dataCols)
          .setBackground(r % 2 === 0 ? ROW_ODD : ROW_EVEN)
          .setFontSize(10)
          .setVerticalAlignment('middle')
          .setFontColor('#1A1A1A')
      }
      sheet.setRowHeights(2, dataRows - 1, 30)
    }

    // 8. Границы по всей таблице
    if (dataRows >= 1) {
      sheet.getRange(1, 1, Math.max(dataRows, 1), dataCols)
        .setBorder(
          true, true, true, true, true, true,
          BORDER_CLR,
          SpreadsheetApp.BorderStyle.SOLID
        )
    }

    // 9. Условное форматирование статусов (только Leads)
    if (cfg.statusCol && dataRows > 1) {
      const statusRange = sheet.getRange(2, cfg.statusCol, dataRows - 1, 1)
      const rules = [
        { val: 'pending',   bg: '#FEF9C3', fg: '#713F12' },  // 🟡 Ожидает
        { val: 'confirmed', bg: '#DCFCE7', fg: '#14532D' },  // 🟢 Подтверждена
        { val: 'completed', bg: '#F1F5F9', fg: '#334155' },  // ⚪ Завершена
        { val: 'cancelled', bg: '#FEE2E2', fg: '#7F1D1D' },  // 🔴 Отменена
      ].map(r =>
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(r.val)
          .setBackground(r.bg)
          .setFontColor(r.fg)
          .setFontWeight('bold')
          .setRanges([statusRange])
          .build()
      )
      sheet.setConditionalFormatRules(rules)
    }

    Logger.log(`✓ Оформлен лист: ${cfg.name}`)
  }

  // Перейти на Leads
  const leads = ss.getSheetByName('Leads')
  if (leads) ss.setActiveSheet(leads)

  SpreadsheetApp.getUi().alert(
    '✅ Готово!\n\n' +
    'Все листы оформлены.\n' +
    'Наведи мышь на любой заголовок — увидишь его русское название.'
  )
}


// ── Запускается автоматически при каждом новом бронировании ──────────────────
// Добавляет чередующийся фон для новой строки (если добавилась)
function onEdit(e) {
  // Ничего не делаем — форматирование ручное через formatAll()
}
