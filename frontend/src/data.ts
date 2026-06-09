import type { Studio, Service, Article } from './types'

export const STUDIOS: Studio[] = [
  {
    id: 'A',
    name: 'Лаборатория',
    tagline: 'СПб · Большой Сампсониевский 60Н',
    description: 'Студия звукозаписи с парком микрофонов на 2 500 000 ₽, инженерами со звукорежиссёрским образованием и оборудованием, запрещённым к поставке в Россию санкциями. 140 м LED-ленты. Приточно-вытяжная вентиляция. Без духоты и суеты.',
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
    color: '#CC0066',
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
    id: 'audeze-lcd-xc',
    name: 'Audeze LCD-XC Carbon',
    category: 'Мониторы',
    tag: 'Наушники · Планарные',
    description: 'Несведённая песня звучит, как готовая. Планарные драйверы дают настоящий бас, открытый верх и широкую сцену — слышишь всё.',
    photo: '/photos/equipment/audeze-lcd-xc.jpg',
  },
  {
    id: 'beyerdynamic-dt1770',
    name: 'Beyerdynamic DT 1770 Pro',
    category: 'Мониторы',
    tag: 'Наушники · Закрытые',
    description: 'Профессиональные студийные наушники закрытого типа. Точная передача низких частот, изоляция от внешних звуков — идеальны для записи вокала и контроля в кабине.',
    photo: '/photos/equipment/beyerdynamic-dt1770.jpg',
  },
  // Цифровое
  {
    id: 'avid-protools',
    name: 'Avid Pro Tools Dock + S1',
    category: 'Цифровое',
    tag: 'DAW · Контроллер',
    description: 'Отраслевой стандарт для записи и постпродакшна — используется в 90% профессиональных студий мира. Два фейдерных модуля S1 для точного управления прямо в сессии.',
    photo: '/photos/equipment/avid-protools.jpg',
  },
  {
    id: 'akai-midimix',
    name: 'AKAI MIDIMIX',
    category: 'Цифровое',
    tag: 'MIDI-контроллер',
    description: 'Компактный микшерный MIDI-контроллер с 8 каналами, матрицей кнопок и потенциометрами. Позволяет управлять треками и эффектами в реальном времени без мышки.',
    photo: '/photos/equipment/akai-midimix.jpg',
  },
]

export const TEAM = [
  {
    id: 'anna',
    name: 'Анна Хлебникова',
    role: 'Звукорежиссёр-наставник',
    specialization: 'Запись · Сведение',
    photo: '/photos/team/anna-hlebnikova.jpg',
    photoPosition: 'center 20%',
    bio: 'Входит в ТОП-3 звукорежиссёров России (XVIII Всероссийский конкурс им. Бабушкина). Состоит в Гильдии звукорежиссёров Российского Музыкального Союза при ЮНЕСКО. Преподаёт звукорежиссуру в СПбГУП. Абсолютный музыкальный слух.',
    facts: [
      'ТОП-3 России · конкурс им. Бабушкина',
      'Гильдия при ЮНЕСКО · РМС',
      'Преподаёт в СПбГУП',
      'Абсолютный слух',
    ],
    tracks: [
      { title: 'Работа 1', url: '/audio/anna/track1.mp3' },
      { title: 'Работа 2', url: '/audio/anna/track2.mp3' },
    ],
  },
  {
    id: 'dioniz',
    name: 'Дионис Каракозиди',
    role: 'Звукорежиссёр-техник',
    specialization: 'Запись · Мастеринг',
    photo: '/photos/team/dioniz-karokozidi.jpg',
    photoPosition: 'center top',
    bio: 'Победитель 6 международных конкурсов по фортепиано за один год. Высшее звукорежиссёрское и музыкальное образование. Абсолютный слух. Виртуозная техническая точность в работе со звуком.',
    facts: [
      '6 побед в международных конкурсах',
      'Абсолютный слух',
      'Высшее звукорежиссёрское образование',
    ],
    tracks: [
      { title: 'Работа 1', url: '/audio/dioniz/track1.mp3' },
      { title: 'Работа 2', url: '/audio/dioniz/track2.mp3' },
    ],
  },
  {
    id: 'semen',
    name: 'Семён Ефименко',
    role: 'Звукорежиссёр-музыкант',
    specialization: 'Запись · Сведение · Аранжировка',
    photo: '/photos/team/semen-efimenko.jpg',
    photoPosition: 'center top',
    bio: 'Поёт и играет на фортепиано, акустической, электро- и бас-гитаре. Высшее звукорежиссёрское и музыкальное образование. Понимает музыку изнутри — слышит аранжировку, чувствует живой звук.',
    facts: [
      'Вокал · фортепиано · гитара · бас',
      'Высшее звукорежиссёрское образование',
      'Музыкальное образование',
    ],
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
        text: 'Парк оборудования на 2 500 000 ₽. Почти всё из списка запрещено к поставке в Россию санкциями как «Товары роскоши» с 15 марта 2022 года. Роскошная новость в том, что мы всё привезли.',
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
