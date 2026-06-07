import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { ARTICLES, SERVICE_CATEGORIES } from '../data'
import { Mic2, Sliders, Key, Package, ChevronRight } from 'lucide-react'
import { ArtistsTicker } from '../components/ArtistsTicker'

// Все 16 фото — крутим как кино
const HERO_IMAGES = [
  '/assets/laba-1.jpg',
  '/assets/laba-3.jpg',
  '/assets/laba-5.jpg',
  '/assets/laba-7.jpg',
  '/assets/laba-9.jpg',
  '/assets/laba-11.jpg',
  '/assets/laba-14.jpg',
  '/assets/laba-15.jpg',
]

const CAT_ICONS: Record<string, React.ReactNode> = {
  record:  <Mic2 size={18} strokeWidth={1.5} />,
  studio:  <Sliders size={18} strokeWidth={1.5} />,
  rent:    <Key size={18} strokeWidth={1.5} />,
  package: <Package size={18} strokeWidth={1.5} />,
}
const CAT_RATES: Record<string, string> = {
  record:  '1 690 ₽/ч',
  studio:  '2 690 ₽/ч',
  rent:    '1 360 ₽/ч',
  package: 'от 7 970 ₽',
}
const CAT_DESC: Record<string, string> = {
  record:  'С звукорежиссёром',
  studio:  'Почасово / дистанционно',
  rent:    'Без инженера',
  package: 'Запись + сведение',
}

export function Home() {
  const { user, haptic } = useTelegram()
  const navigate = useNavigate()
  const [heroIndex, setHeroIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const featuredArticle = useMemo(() => ARTICLES[Math.floor(Math.random() * ARTICLES.length)], [])

  useEffect(() => {
    const t = setInterval(() => {
      setPrevIndex(i => i)
      setHeroIndex(i => (i + 1) % HERO_IMAGES.length)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const go = (cat?: string) => {
    haptic?.impactOccurred('medium')
    navigate('/booking', cat ? { state: { category: cat } } : undefined)
  }

  return (
    <div className="pb-nav bg-[#0E0E0E] min-h-screen">

      {/* ── HERO: чистые фотографии ── */}
      <div className="relative overflow-hidden" style={{ height: '88vw', maxHeight: 480 }}>

        {/* Все кадры */}
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: i === heroIndex ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
              zIndex: i === heroIndex ? 2 : 1,
            }}
          />
        ))}

        {/* Градиент: темнее сверху и снизу */}
        <div className="absolute inset-0 z-10"
          style={{ background: 'linear-gradient(to bottom, rgba(14,14,14,0.55) 0%, transparent 35%, transparent 55%, rgba(14,14,14,0.95) 100%)' }} />

        {/* Шапка: надпись студии */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">Студия</span>
          </div>
          {user && (
            <span className="text-[11px] text-white/40">
              {user.first_name}
            </span>
          )}
        </div>

        {/* Нижняя часть героя: название + тэглайн */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6">
          <h1 className="font-display font-black text-3xl text-white leading-none tracking-tight mb-1">
            ЛАБОРАТОРИЯ
          </h1>
          <p className="text-white/50 text-sm tracking-widest uppercase">
            Санкт-Петербург
          </p>
        </div>

        {/* Dots */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1.5">
          {HERO_IMAGES.map((_, i) => (
            <div
              key={i}
              onClick={() => setHeroIndex(i)}
              className="rounded-full transition-all duration-400"
              style={{
                width: 4,
                height: i === heroIndex ? 20 : 4,
                backgroundColor: i === heroIndex ? '#C17BFF' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── TAGLINE + CTA ── */}
      <div className="px-4 pt-7 pb-6">
        <p className="text-white/40 text-sm mb-2 font-medium">
          Создай свой звук.
        </p>
        <h2 className="font-display font-black text-2xl text-white leading-tight mb-6">
          Готовый трек<br/>
          <span className="text-lily">за 8 часов.</span>
        </h2>
        <button
          onClick={() => go()}
          className="btn-lily w-full py-4 text-base font-bold rounded-2xl"
        >
          Записаться на сессию
        </button>
      </div>

      {/* Разделитель */}
      <div className="h-px bg-[#1E1E1E] mx-4 mb-6" />

      <div className="px-4 space-y-8">

        {/* ── АРТИСТЫ ── */}
        <ArtistsTicker />

        {/* ── УСЛУГИ: горизонтальный скролл ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Услуги</p>
            <button onClick={() => go()} className="flex items-center gap-1 text-[11px] text-[#C17BFF] font-semibold">
              Все <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => go(cat.id)}
                className="flex-shrink-0 card-lab p-4 rounded-2xl text-left active:scale-95 transition-transform"
                style={{ minWidth: 148 }}
              >
                <div className="w-9 h-9 rounded-xl bg-[#C17BFF]/10 flex items-center justify-center text-[#C17BFF] mb-3">
                  {CAT_ICONS[cat.id]}
                </div>
                <div className="font-bold text-white text-sm mb-0.5">{cat.label}</div>
                <div className="text-[10px] text-white/35 mb-2.5 leading-snug">{CAT_DESC[cat.id]}</div>
                <div className="font-bold text-[#C17BFF] text-sm">{CAT_RATES[cat.id]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── ФОТО-ГАЛЕРЕЯ (2 строки) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Студия</p>
            <button onClick={() => navigate('/studios')} className="flex items-center gap-1 text-[11px] text-[#C17BFF] font-semibold">
              Все фото <ChevronRight size={12} />
            </button>
          </div>

          {/* Мозаика: большое фото слева + 2 маленьких справа */}
          <div className="flex gap-2" style={{ height: 180 }}>
            <button
              onClick={() => navigate('/studios')}
              className="flex-1 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
            >
              <img src="/assets/laba-2.jpg" alt="" className="w-full h-full object-cover" />
            </button>
            <div className="flex flex-col gap-2" style={{ width: '38%' }}>
              <button
                onClick={() => navigate('/studios')}
                className="flex-1 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
              >
                <img src="/assets/laba-4.jpg" alt="" className="w-full h-full object-cover" />
              </button>
              <button
                onClick={() => navigate('/studios')}
                className="flex-1 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform relative"
              >
                <img src="/assets/laba-6.jpg" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+13</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── СТАТЬЯ ── */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Читать</p>
          <button
            onClick={() => { haptic?.impactOccurred('light'); navigate(`/media/${featuredArticle.id}`) }}
            className="w-full relative rounded-2xl overflow-hidden active:scale-[0.98] transition-all card-lab border border-[#2A2A2A]"
            style={{ height: 110 }}
          >
            <img src={featuredArticle.cover} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111]/95 via-[#111]/70 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
                bg-[#C17BFF]/15 text-[#C17BFF] border border-[#C17BFF]/25 self-start">
                {featuredArticle.tag}
              </span>
              <div>
                <p className="text-sm font-semibold text-white leading-snug">{featuredArticle.title}</p>
                <p className="text-[10px] text-white/30 mt-1">{featuredArticle.readTime} мин</p>
              </div>
            </div>
          </button>
        </div>

        {/* ── ИНФО СЕТКА ── */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">О студии</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji: '📍', title: 'Адрес', sub: 'Бол. Сампсониевский 60Н\nм. Выборгская' },
              { emoji: '🕐', title: 'Работаем', sub: '0:00 — 24:00\nЕжедневно' },
              { emoji: '⚡', title: 'Предоплата', sub: '50% при записи\nВозврат при отмене' },
              { emoji: '🎙️', title: 'Парк микрофонов', sub: 'Manley · Neumann\nна 1 500 000 ₽' },
            ].map(({ emoji, title, sub }) => (
              <div key={title} className="p-4 rounded-2xl card-lab">
                <div className="text-xl mb-2">{emoji}</div>
                <div className="text-xs font-bold text-white mb-1">{title}</div>
                <div className="text-[11px] text-white/40 leading-snug whitespace-pre-line">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── СОЦИАЛЬНОЕ ДОКАЗАТЕЛЬСТВО ── */}
        <div className="card-lab rounded-2xl p-4 border border-[#C17BFF]/10">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">💬</div>
            <div>
              <p className="text-sm text-white/70 leading-relaxed italic mb-2">
                «Единственная студия в городе, где к тебе относятся как к артисту, а не как к клиенту»
              </p>
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">
                Один из наших артистов
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* bottom padding extra */}
      <div className="h-4" />
    </div>
  )
}
