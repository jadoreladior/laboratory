import type { Studio, Service, Article } from './types'

export const STUDIOS: Studio[] = [
  {
    id: 'A',
    name: 'Лаборатория',
    tagline: 'Профессиональная запись. Твой звук.',
    description: 'Просторная студия с профессиональным оборудованием, акустической обработкой и атмосферой, в которой рождается музыка. Curved-монитор, зона отдыха, неон. Для тех, кто приходит работать.',
    features: ['Акустическая обработка', 'Curved монитор', 'Зона отдыха', 'Неоновый свет', 'Профессиональный звукорежиссёр'],
    color: '#ffffff',
    images: ['/assets/studio-a-1.jpg', '/assets/studio-a-2.jpg'],
  },
]

export const SERVICES: Service[] = [
  // Запись со звукорежиссёром
  { id: 'rec-1', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 1, price: 1765, prepayPercent: 50 },
  { id: 'rec-2', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 2, price: 3530, prepayPercent: 50 },
  { id: 'rec-3', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 3, price: 5295, prepayPercent: 50 },
  { id: 'rec-4', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 4, price: 7060, prepayPercent: 50 },

  // Работа на студии
  { id: 'std-1', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 1, price: 2425, prepayPercent: 50 },
  { id: 'std-2', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 2, price: 4850, prepayPercent: 50 },
  { id: 'std-3', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 3, price: 7275, prepayPercent: 50 },
  { id: 'std-4', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 4, price: 9700, prepayPercent: 50 },

  // Обучение
  { id: 'edu-1', category: 'studio', title: 'Обучение', description: 'Работа в Ableton Live, Logic Pro, FL Studio — для новичков и продолжающих', duration: 3, price: 10780, prepayPercent: 50 },

  // Вокал и голос
  { id: 'voc-1', category: 'voice', title: 'Вокал', description: 'Раскроем твой голос, отработаем подачу и чувство ритма', duration: 1, price: 3300, prepayPercent: 50 },
  { id: 'voc-2', category: 'voice', title: 'Ораторское мастерство', description: 'Развитие голоса, дикции и харизмы в индивидуальном занятии', duration: 1, price: 3300, prepayPercent: 50 },

  // Аренда без звукорежиссёра
  { id: 'rent-1', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа без звукорежиссёра', duration: 1, price: 1215, prepayPercent: 50 },
  { id: 'rent-2', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа без звукорежиссёра', duration: 2, price: 2430, prepayPercent: 50 },
  { id: 'rent-3', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа без звукорежиссёра', duration: 3, price: 3645, prepayPercent: 50 },
  { id: 'rent-4', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа без звукорежиссёра', duration: 4, price: 4860, prepayPercent: 50 },

  // Пакеты
  { id: 'pkg-6',  category: 'package', title: 'Пакет 6 часов',  description: 'Выгодный пакет аренды на 6 часов',  duration: 6,  price: 6600,  prepayPercent: 50 },
  { id: 'pkg-10', category: 'package', title: 'Пакет 10 часов', description: 'Выгодный пакет аренды на 10 часов', duration: 10, price: 9900,  prepayPercent: 50 },
  { id: 'pkg-15', category: 'package', title: 'Пакет 15 часов', description: 'Выгодный пакет аренды на 15 часов', duration: 15, price: 13200, prepayPercent: 50 },
  { id: 'pkg-20', category: 'package', title: 'Пакет 20 часов', description: 'Максимальный пакет аренды на 20 часов', duration: 20, price: 15400, prepayPercent: 50 },
]

export const SERVICE_CATEGORIES = [
  { id: 'record',  label: 'Запись' },
  { id: 'studio',  label: 'Продакшн' },
  { id: 'voice',   label: 'Голос' },
  { id: 'rent',    label: 'Аренда' },
  { id: 'package', label: 'Пакеты' },
] as const

export const ARTICLES: Article[] = [
  {
    id: 'visagangbeatz',
    title: '5 вопросов VisaGangBeatz',
    subtitle: 'Продюсер о работе с Boulevard Depo, Feduk и GONE.Fludd — и о том, как рождаются биты',
    cover: '/assets/visa-gredy.jpg',
    date: '2020-10-19',
    readTime: 4,
    tag: 'Интервью',
    blocks: [
      {
        type: 'paragraph',
        text: 'VisaGangBeatz (Александр Адамов) — молодой и талантливый саунд-продюсер из Москвы, успевший поработать с такими популярными артистами как Boulevard Depo, Feduk, OG Buda, GONE.Fludd, THRILL PILL, MAYOT и многими другими!',
      },
      {
        type: 'qa',
        question: 'Хип-Хоп на русском или на английском, что больше по душе?',
        answer: 'В последнее время уделяю много внимания русскому трэпу, так как нужно постоянно крутиться в этой движухе, дабы не отставать от тенденций. А по душе, конечно, англоязычная сцена.',
      },
      {
        type: 'qa',
        question: 'Главная проблема современных русских рэперов?',
        answer: 'Наверное, трабл заключается в том, что некоторые СНГ-артисты слишком много смотрят друг на друга. Хотелось бы видеть больше уникального звука.',
      },
      {
        type: 'qa',
        question: 'Как работаешь с крупными исполнителями?',
        answer: 'На самом деле, ничего необычного нет — если им нужны мои биты, они просто пишут «салют, закинь что имеешь по битам», так и работаем.',
      },
      {
        type: 'qa',
        question: 'Тебе нравится твоя домашняя студия? Сколько потратил?',
        answer: 'Несомненно, это была моя мечта и я её исполнил. Не считал, но больше 500.000₽ точно.',
      },
      {
        type: 'quote',
        text: 'Записывайтесь только на классные биты и только в классной студии — Лаборатория!',
      },
    ],
  },
  {
    id: 'beat-licensing',
    title: 'Как работает лицензирование битов',
    subtitle: 'Почему это важно для каждого артиста и как не потерять деньги',
    cover: '/assets/studio-a-2.jpg',
    date: '2020-07-01',
    readTime: 5,
    tag: 'Гайд',
    blocks: [
      {
        type: 'paragraph',
        text: 'Сейчас наступило такое время, что люди могут получать деньги с того, чем они занимаются. Монетизировать музыку до сегодняшнего дня — такого в России не было. Сейчас с каждым годом наш рынок развивается всё стремительнее.',
      },
      {
        type: 'heading',
        text: 'Виды лицензий',
      },
      {
        type: 'qa',
        question: 'Basic Leasing',
        answer: 'Бит в формате MP3 с войс-тегом. Создан для тех, кто не собирается монетизировать музыку. Лучший вариант для начинающих.',
      },
      {
        type: 'qa',
        question: 'Premium Leasing',
        answer: 'Для тех, кто хочет монетизировать музыку. Включает WAV и Track Out для сведения. В придачу — договор на монетизацию.',
      },
      {
        type: 'qa',
        question: 'Exclusive Rights',
        answer: 'Для серьёзных релизов. Права на бит переходят артисту, авторство остаётся за битмейкером. Бит снимается с продажи.',
      },
      {
        type: 'quote',
        text: 'Оставайтесь собой. Всегда цените труд других людей и не переставайте искать!',
      },
    ],
  },
]
