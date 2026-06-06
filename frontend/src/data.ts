import type { Studio, Service, Article } from './types'

export const STUDIOS: Studio[] = [
  {
    id: 'A',
    name: 'Лаборатория',
    tagline: 'СПб · Большой Сампсониевский 60Н',
    description: 'Студия звукозаписи с парком микрофонов на 1 500 000 ₽, инженерами со звукорежиссёрским образованием и оборудованием, запрещённым к поставке в Россию санкциями. 140 м LED-ленты. Приточно-вытяжная вентиляция. Без духоты и суеты.',
    features: [
      'Manley Reference Silver',
      'Neumann TLM 67',
      'PMC IB1S-AIII',
      'UA Apollo x6',
      'Manley VOXBOX',
      'Rupert Neve 511/535',
      'Avid Pro Tools',
      'Audeze LCD-XC',
    ],
    color: '#C17BFF',
    images: ['/assets/studio-a-1.jpg', '/assets/studio-a-2.jpg'],
  },
]

export const SERVICES: Service[] = [
  // Запись со звукорежиссёром
  { id: 'rec-1', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 1, price: 1765, prepayPercent: 50 },
  { id: 'rec-2', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 2, price: 3530, prepayPercent: 50 },
  { id: 'rec-3', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 3, price: 5295, prepayPercent: 50 },
  { id: 'rec-4', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 4, price: 7060, prepayPercent: 50 },

  // Сведение и мастеринг
  { id: 'mix-1', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 1, price: 2425, prepayPercent: 50 },
  { id: 'mix-2', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 2, price: 4850, prepayPercent: 50 },
  { id: 'mix-3', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 3, price: 7275, prepayPercent: 50 },
  { id: 'mix-4', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 4, price: 9700, prepayPercent: 50 },

  // Аренда без звукорежиссёра
  { id: 'rent-1', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 1, price: 1215, prepayPercent: 50 },
  { id: 'rent-2', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 2, price: 2430, prepayPercent: 50 },
  { id: 'rent-3', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 3, price: 3645, prepayPercent: 50 },
  { id: 'rent-4', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 4, price: 4860, prepayPercent: 50 },

  // Пакеты
  { id: 'pkg-6',  category: 'package', title: 'Пакет 6 часов',  description: '6 часов аренды по выгодной цене',  duration: 6,  price: 6600,  prepayPercent: 50 },
  { id: 'pkg-10', category: 'package', title: 'Пакет 10 часов', description: '10 часов аренды по выгодной цене', duration: 10, price: 9900,  prepayPercent: 50 },
  { id: 'pkg-15', category: 'package', title: 'Пакет 15 часов', description: '15 часов аренды по выгодной цене', duration: 15, price: 13200, prepayPercent: 50 },
  { id: 'pkg-20', category: 'package', title: 'Пакет 20 часов', description: 'Максимальный пакет — 20 часов аренды', duration: 20, price: 15400, prepayPercent: 50 },
]

export const SERVICE_CATEGORIES = [
  { id: 'record',  label: 'Запись' },
  { id: 'studio',  label: 'Сведение' },
  { id: 'rent',    label: 'Аренда' },
  { id: 'package', label: 'Пакеты' },
] as const

export const ARTICLES: Article[] = [
  {
    id: 'services-record',
    title: 'Услуга: Запись',
    subtitle: 'Чистая запись, комфорт и «тот самый звук» — с чего начинается любой релиз',
    cover: '/assets/studio-a-1.jpg',
    date: '2025-10-28',
    readTime: 3,
    tag: 'Услуги',
    blocks: [
      {
        type: 'paragraph',
        text: 'Начинаем с того, что запускает любой релиз: чистая запись, комфорт и «тот самый звук».',
      },
      {
        type: 'heading',
        text: 'Что вы получаете',
      },
      {
        type: 'qa',
        question: 'Универсальный микрофон Manley Reference Silver',
        answer: 'Шёлковый верх и правильная глубина тембра. В такой записывался Drake.',
      },
      {
        type: 'qa',
        question: 'Контроль в ушах',
        answer: 'В вокальной есть пульт — вы сами настраиваете балансы через AKAI MIDIMIX, не отвлекая звукорежиссёра.',
      },
      {
        type: 'qa',
        question: 'Готовое демо сразу после сессии',
        answer: 'Приятно переслушивать и отправлять. Референс → саундчек → запись в комфортном темпе → исходники + демо.',
      },
      {
        type: 'qa',
        question: 'Инженер-партнёр',
        answer: 'Поможем с тональностью, кликом, стеком тейков/дублей, дыханием и дистанцией до микрофона.',
      },
      {
        type: 'heading',
        text: 'Дополнительные опции',
      },
      {
        type: 'qa',
        question: '+490 ₽/час — Все микрофоны',
        answer: 'A/B-тест на саундчеке: Manley Reference Cardioid (яркий верх, поп и речитатив), Neumann TLM 67 (бархатная середина, олдскул рэп и рок), Shure SM7B (индустриальный стандарт для громких голосов).',
      },
      {
        type: 'qa',
        question: '+290 ₽/час — Аналоговые обработки',
        answer: 'Ламповая сатурация и компрессия прямо в цепочке записи через Manley VOXBOX. Смягчает «с»/«ш», округляет пики, добавляет музыкальные гармоники — голос становится ближе и читается в миксе.',
      },
      {
        type: 'quote',
        text: 'Готовое демо звучит законченно, а на сведение уходит меньше времени.',
      },
    ],
  },
  {
    id: 'services-mix',
    title: 'Услуга: Сведение',
    subtitle: 'Уедьте со студии с готовой релизной версией — делаем это вместе',
    cover: '/assets/studio-a-2.jpg',
    date: '2025-10-29',
    readTime: 3,
    tag: 'Услуги',
    blocks: [
      {
        type: 'paragraph',
        text: 'Если хотите присутствовать на процессе и уехать со студии с готовой релизной версией — делаем это вместе.',
      },
      {
        type: 'heading',
        text: 'Что делаем на сессии',
      },
      {
        type: 'qa',
        question: 'Баланс и динамика',
        answer: 'Удачный баланс громкости между голосом и инструментами. Ручные и автоматические обработки, где нужно — аналоговые через 500-серию Rupert Neve и SSL.',
      },
      {
        type: 'qa',
        question: 'Пространство под жанр',
        answer: 'Реверб и дилей с характером, аккуратные переходы и автоматизации. Контроль на PMC IB1S-AIII и Result6, проверка моно-совместимости.',
      },
      {
        type: 'qa',
        question: 'Стриминговые стандарты',
        answer: 'Громкость, пик-лимитинг, экспорт без артефактов. Документация и порядок в файлах.',
      },
      {
        type: 'heading',
        text: 'Что получаете на выходе',
      },
      {
        type: 'qa',
        question: 'Финальный мастер',
        answer: 'По запросу: instrumental / acapella / performance / clean-версия. Исходники и стемы, готовые к передаче лейблу или дистрибьютору.',
      },
      {
        type: 'quote',
        text: 'Работаем с MP3, WAV и trackout — подстроим процесс под ваш проект.',
      },
    ],
  },
  {
    id: 'equipment',
    title: 'Оборудование',
    subtitle: 'Всё новое. Софт лицензионный. Большинство — запрещено к поставке санкциями.',
    cover: '/assets/studio-a-1.jpg',
    date: '2025-11-04',
    readTime: 4,
    tag: 'О студии',
    blocks: [
      {
        type: 'paragraph',
        text: 'Парк оборудования на 1 500 000 ₽. Почти всё из списка запрещено к поставке в Россию санкциями как «Товары роскоши» с 15 марта 2022 года. Роскошная новость в том, что мы всё привезли.',
      },
      {
        type: 'heading',
        text: 'Микрофоны',
      },
      {
        type: 'qa',
        question: 'Manley Reference Silver',
        answer: 'В такой записывался Drake. Шёлковый верх, правильная глубина тембра. Ручная американская работа.',
      },
      {
        type: 'qa',
        question: 'Manley Reference Cardioid',
        answer: 'В такой записывали часть песни «Despacito». Яркий, собранный верх — современный поп и речитатив.',
      },
      {
        type: 'qa',
        question: 'Neumann TLM 67',
        answer: 'Премия TEC Award 2009. Тёплый звук из 60-х: бархатная середина, лёгкий винтаж. Олдскул рэп, рок.',
      },
      {
        type: 'qa',
        question: 'Shure SM7B',
        answer: 'Индустриальный стандарт теле-радио. Хорош для громких голосов.',
      },
      {
        type: 'heading',
        text: 'Мониторы и наушники',
      },
      {
        type: 'qa',
        question: 'PMC IB1S-AIII',
        answer: 'Мониторы среднего поля из Англии — гордость Лаборатории. Одна колонка весит, как половина взрослого человека.',
      },
      {
        type: 'qa',
        question: 'Audeze LCD-XC Carbon',
        answer: 'Несведённая песня звучит, как готовая. Есть бас, есть верхас, есть ширина.',
      },
      {
        type: 'heading',
        text: 'Ключевые приборы',
      },
      {
        type: 'qa',
        question: 'Manley VOXBOX',
        answer: 'Усилитель + компрессор + де-эссер + EQ в одном корпусе. Channel strip как в каждой профессиональной студии мира.',
      },
      {
        type: 'qa',
        question: 'Rupert Neve 511 + 535 / SSL Ultraviolet / WES Audio',
        answer: '500-серия: пять устройств в одном корпусе — преамп Neve, компрессор Neve, эквалайзеры SSL и Pultec, G Bus компрессор.',
      },
      {
        type: 'qa',
        question: 'Universal Audio Apollo x6',
        answer: 'Звуковая карта с DSP-процессором. Проекты любого размера без зависаний.',
      },
      {
        type: 'quote',
        text: 'Инженеры со звукорежиссёрским образованием. Отвечаем на вопросы за 5 минут: @laba_spb_chat',
      },
    ],
  },
]
