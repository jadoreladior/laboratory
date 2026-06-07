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
    images: [
      '/photos/studio/main.jpg',
      '/photos/studio/2.jpg',
      '/photos/studio/3.jpg',
      '/photos/studio/4.jpg',
      '/photos/studio/5.jpg',
      '/photos/studio/6.jpg',
      '/photos/studio/7.jpg',
      '/photos/studio/8.jpg',
    ],
  },
]

export const SERVICES: Service[] = [
  // Запись со звукорежиссёром — 1 690 ₽/час
  { id: 'rec-1', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 1, price: 1690, prepayPercent: 50 },
  { id: 'rec-2', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 2, price: 3380, prepayPercent: 50 },
  { id: 'rec-3', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 3, price: 5070, prepayPercent: 50 },
  { id: 'rec-4', category: 'record', title: 'Запись', description: 'Запись со звукорежиссёром + готовое демо после сессии', duration: 4, price: 6760, prepayPercent: 50 },

  // Готовый трек — запись + сведение на месте
  { id: 'gt-3',  category: 'package', title: 'Готовый трек', description: 'Запись и сведение на месте — уходишь с финальной версией', duration: 3,  price: 7970,  prepayPercent: 50 },
  { id: 'gt-5',  category: 'package', title: 'Готовый трек', description: 'Запись и сведение на месте — уходишь с финальной версией', duration: 5,  price: 11970, prepayPercent: 50 },
  { id: 'gt-6',  category: 'package', title: 'Готовый трек', description: 'Запись и сведение на месте — уходишь с финальной версией', duration: 6,  price: 13970, prepayPercent: 50 },

  // Сведение почасовое — 2 690 ₽/час
  { id: 'mix-1', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 1, price: 2690, prepayPercent: 50 },
  { id: 'mix-2', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 2, price: 5380, prepayPercent: 50 },
  { id: 'mix-3', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 3, price: 8070, prepayPercent: 50 },
  { id: 'mix-4', category: 'studio', title: 'Сведение', description: 'Почасовое сведение: баланс, частоты, пространство, стриминговые стандарты', duration: 4, price: 10760, prepayPercent: 50 },

  // Сведение дистанционное — фиксированная цена
  { id: 'mix-dist', category: 'studio', title: 'Сведение дистанционно', description: 'Присылаешь исходники — мы сводим. 3 раунда правок включены', duration: 0, price: 9990, prepayPercent: 50 },

  // Аренда без звукорежиссёра — 1 360 ₽/час
  { id: 'rent-1', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 1, price: 1360, prepayPercent: 50 },
  { id: 'rent-2', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 2, price: 2720, prepayPercent: 50 },
  { id: 'rent-3', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 3, price: 4080, prepayPercent: 50 },
  { id: 'rent-4', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа — без звукорежиссёра', duration: 4, price: 5440, prepayPercent: 50 },
]

export const SERVICE_CATEGORIES = [
  { id: 'record',  label: 'Запись' },
  { id: 'studio',  label: 'Сведение' },
  { id: 'rent',    label: 'Аренда' },
  { id: 'package', label: 'Готовый трек' },
] as const

export const ADDONS = [
  { id: 'video',       label: 'Видеосъёмка сессии',   description: 'Лучшие моменты на видео',              price: 3000, priceLabel: '3 000 ₽' },
  { id: 'arrangement', label: 'Аранжировка',           description: 'Помощь с битом и аккомпанементом',     price: null, priceLabel: 'По запросу' },
  { id: 'lyrics',      label: 'Написание текста',       description: 'Совместная работа над словами',        price: null, priceLabel: 'По запросу' },
  { id: 'backing',     label: 'Живые бэк-вокалы',      description: 'Гармонии и бэки для трека',            price: null, priceLabel: 'По запросу' },
  { id: 'photoshoot',  label: 'Фотосессия в студии',   description: 'Контент для соцсетей',                 price: 2000, priceLabel: '2 000 ₽' },
]

export const STUDIO_RULES = [
  { icon: 'payment',  text: '**Предоплата 50%** при записи — возвращаем при отмене **за 24 ч**' },
  { icon: 'smoke',    text: 'Курение, кальяны и айкосы — **только за пределами** студии' },
  { icon: 'drink',    text: 'Алкоголь не запрещён, если помогает творчеству — но **без потери берегов**' },
  { icon: 'edit',     text: '**3 раунда правок** входят в стоимость сведения' },
  { icon: 'camera',   text: 'В студии **работают камеры** — за порчу оборудования несёте ответственность' },
  { icon: 'ban',      text: '**Хамство и угрозы** — мы вправе прекратить сессию в любой момент' },
]

export const EQUIPMENT_ITEMS = [
  // Микрофоны
  {
    id: 'manley-silver',
    name: 'Manley Reference Silver',
    category: 'Микрофоны',
    tag: 'Конденсаторный · Ламповый',
    description: 'В такой записывался Drake. Шёлковый верх, правильная глубина тембра. Ручная американская работа — один из лучших вокальных микрофонов в мире.',
    photo: '/photos/equipment/manley-reference-silver.jpg',
  },
  {
    id: 'manley-cardioid',
    name: 'Manley Reference Cardioid',
    category: 'Микрофоны',
    tag: 'Конденсаторный · Ламповый',
    description: 'В такой записывали часть «Despacito». Яркий, собранный верх — идеален для современного попа и речитатива.',
    photo: '/photos/equipment/manley-reference-cardioid.jpg',
  },
  {
    id: 'neumann-tlm67',
    name: 'Neumann TLM 67',
    category: 'Микрофоны',
    tag: 'Конденсаторный · Студийный',
    description: 'Лауреат TEC Award 2009. Тёплый звук из 60-х: бархатная середина, лёгкий винтажный характер. Идеален для олдскул рэпа и рока.',
    photo: '/photos/equipment/neumann-tlm67.jpg',
  },
  {
    id: 'shure-sm7b',
    name: 'Shure SM7B',
    category: 'Микрофоны',
    tag: 'Динамический',
    description: 'Индустриальный стандарт теле- и радиоиндустрии. Хорош для громких и экспрессивных голосов — убирает лишнее, оставляет мощь.',
    photo: '/photos/equipment/shure-sm7b.jpg',
  },
  // Мониторы
  {
    id: 'pmc-ib1s',
    name: 'PMC IB1S-AIII',
    category: 'Мониторы',
    tag: 'Активный · Среднее поле',
    description: 'Гордость Лаборатории. Мониторы среднего поля из Англии — одна колонка весит, как половина взрослого человека. Референсный звук без прикрас.',
    photo: '/photos/equipment/pmc-ib1s.jpg',
  },
  {
    id: 'yamaha-ns10',
    name: 'Yamaha NS-10',
    category: 'Мониторы',
    tag: 'Пассивный · Ближнее поле',
    description: 'Культовый монитор, обязательный в любой профессиональной студии. Если звучит хорошо на NS-10 — будет звучать везде.',
    photo: '/photos/equipment/yamaha-ns10.jpg',
  },
  {
    id: 'audeze-lcd-xc',
    name: 'Audeze LCD-XC Carbon',
    category: 'Мониторы',
    tag: 'Наушники · Планарные',
    description: 'Несведённая песня звучит, как готовая. Планарные драйверы дают настоящий бас, открытый верх и широкую сцену — слышишь всё.',
    photo: '/photos/equipment/audeze-lcd-xc.jpg',
  },
  // Обработка
  {
    id: 'manley-voxbox',
    name: 'Manley VOXBOX',
    category: 'Обработка',
    tag: 'Channel Strip · Ламповый',
    description: 'Усилитель + компрессор + де-эссер + EQ в одном корпусе. Channel strip как в каждой профессиональной студии мира. Голос становится ближе и читается в миксе.',
    photo: '/photos/equipment/manley-voxbox.jpg',
  },
  {
    id: 'neve-511-535',
    name: 'Rupert Neve 511 + 535',
    category: 'Обработка',
    tag: '500-серия · Аналог',
    description: 'Легендарный преамп и компрессор Neve в формате 500-серии. Тот самый «Neve-sound» — тёплый, музыкальный, с характером.',
    photo: '/photos/equipment/neve-511-535.jpg',
  },
  {
    id: 'ssl-fusion',
    name: 'SSL Fusion',
    category: 'Обработка',
    tag: 'Мастер-процессор · Аналог',
    description: 'Аналоговый мастер-процессор SSL. Добавляет клей, присущий профессиональным релизам — звук становится единым и читаемым.',
    photo: '/photos/equipment/ssl-fusion.jpg',
  },
  // Цифровое
  {
    id: 'ua-apollo-x6',
    name: 'UA Apollo x6',
    category: 'Цифровое',
    tag: 'Звуковая карта · DSP',
    description: 'Звуковая карта с DSP-процессором от Universal Audio. Проекты любого размера без зависаний — и весь каталог UAD-плагинов в реальном времени.',
    photo: '/photos/equipment/ua-apollo-x6.jpg',
  },
  {
    id: 'avid-protools',
    name: 'Avid Pro Tools',
    category: 'Цифровое',
    tag: 'DAW · Лицензионный',
    description: 'Отраслевой стандарт для записи и постпродакшна. Используется в 90% профессиональных студий мира. Лицензионная версия с полным набором плагинов.',
    photo: '/photos/equipment/avid-protools.jpg',
  },
]

export const TEAM = [
  {
    id: 'anna',
    name: 'Анна Хлебникова',
    role: 'Звукорежиссёр',
    specialization: 'Запись · Сведение',
    photo: '/photos/team/anna-hlebnikova.jpg',
    photoPosition: 'center 20%',
    bio: 'Профессиональный звукорежиссёр с консерваторским образованием. Специализируется на работе с вокалом — создаёт атмосферный, живой звук. Работала с исполнителями в жанрах R&B, поп и инди.',
    tracks: [
      { title: 'Работа 1', url: '/audio/anna/track1.mp3' },
      { title: 'Работа 2', url: '/audio/anna/track2.mp3' },
    ],
  },
  {
    id: 'dioniz',
    name: 'Дионис Карокозиди',
    role: 'Звукорежиссёр',
    specialization: 'Запись · Мастеринг',
    photo: '/photos/team/dioniz-karokozidi.jpg',
    photoPosition: 'center top',
    bio: 'Многолетний опыт в записи и мастеринге. Тонко чувствует динамику и пространство. Предпочитает хип-хоп, рэп и электронную музыку. Знает, как сделать так, чтобы трек звучал громко и чётко на любых колонках.',
    tracks: [
      { title: 'Работа 1', url: '/audio/dioniz/track1.mp3' },
      { title: 'Работа 2', url: '/audio/dioniz/track2.mp3' },
    ],
  },
  {
    id: 'semen',
    name: 'Семён Ефименко',
    role: 'Звукорежиссёр',
    specialization: 'Запись · Сведение · Аранжировка',
    photo: '/photos/team/semen-efimenko.jpg',
    photoPosition: 'center top',
    bio: 'Мультиинструменталист и аранжировщик. Помогает выстроить аккомпанемент прямо на сессии. Работает в рок, поп и авторской песне. Если нужен живой звук с характером — это к Семёну.',
    tracks: [
      { title: 'Работа 1', url: '/audio/semen/track1.mp3' },
      { title: 'Работа 2', url: '/audio/semen/track2.mp3' },
    ],
  },
]

export const ARTICLES: Article[] = [
  {
    id: 'ustav',
    title: 'Устав Лаборатории',
    subtitle: 'Правила, которые делают студию комфортной для всех',
    cover: '/assets/laba-4.jpg',
    date: '2025-11-04',
    readTime: 3,
    tag: 'О студии',
    blocks: [
      {
        type: 'heading',
        text: 'Предоплата 50%',
      },
      {
        type: 'paragraph',
        text: 'Когда вы бронируете время в Лаборатории, мы просим внести 50% предоплаты, чтобы вы подтвердили свои намерения. Предоплату можно вернуть при отмене заблаговременно.',
      },
      {
        type: 'heading',
        text: 'Курение и алкоголь',
      },
      {
        type: 'qa',
        question: 'Что можно, а что нельзя',
        answer: 'Сигареты, Айкосы, кальяны, бонги и трубки — только за пределами студии. Электронки можно парить внутри. Алкоголь не запрещён, если это помогает творчеству. Но если вы теряете берега — звукорежиссёр может прервать запись. В двух шагах: «Ароматный Мир», «Красное&Белое», «Дикси».',
      },
      {
        type: 'heading',
        text: 'Хамство и угрозы',
      },
      {
        type: 'paragraph',
        text: 'Если вы грубо обращаетесь с имуществом, хамите, угрожаете дракой или богатым папой — мы прекратим работу и попросим уйти, даже если вы очень известный.',
      },
      {
        type: 'heading',
        text: 'Имущество',
      },
      {
        type: 'qa',
        question: 'Признаёте вину',
        answer: 'Прикинем ущерб и предложим возместить на месте. Если денег нет — долговая расписка с ИП.',
      },
      {
        type: 'qa',
        question: 'Не признаёте вину',
        answer: 'В Лаборатории работают камеры. Мы вряд ли оставим это просто так.',
      },
      {
        type: 'heading',
        text: 'Правки сведения',
      },
      {
        type: 'paragraph',
        text: 'У вас всегда есть 3 раунда правок — они входят в стоимость. Собираете все правки в один список → звукорежиссёр вносит → присылает новую версию. Так до трёх раундов.',
      },
      {
        type: 'quote',
        text: 'Если вам плохо — мы не оставим в беде. Помогут все, кто есть в Лабе и рядом.',
      },
    ],
  },
  {
    id: 'services-record',
    title: 'Услуга: Запись',
    subtitle: 'Чистая запись, комфорт и «тот самый звук» — с чего начинается любой релиз',
    cover: '/assets/laba-3.jpg',
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
    cover: '/assets/laba-5.jpg',
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
    cover: '/assets/laba-1.jpg',
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
