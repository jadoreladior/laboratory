import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { STUDIOS, ARTICLES, SERVICE_CATEGORIES } from '../data'
import { Mic2, Sliders, Key, Package } from 'lucide-react'
import { ArtistsTicker } from '../components/ArtistsTicker'

const CAT_ICONS: Record<string, React.ReactNode> = {
  record:  <Mic2 size={20} strokeWidth={1.5} />,
  studio:  <Sliders size={20} strokeWidth={1.5} />,
  rent:    <Key size={20} strokeWidth={1.5} />,
  package: <Package size={20} strokeWidth={1.5} />,
}

const CAT_RATES: Record<string, string> = {
  record:  '1 690 ₽/ч',
  studio:  '2 690 ₽/ч',
  rent:    '1 360 ₽/ч',
  package: 'от 7 970 ₽',
}

const CAT_DESC: Record<string, string> = {
  record:  'С звукорежиссёром',
  studio:  'Почасово или дистанционно',
  rent:    'Без инженера',
  package: 'Запись + сведение',
}

export function Home() {
  const { user, haptic } = useTelegram()
  const navigate = useNavigate()
  const [heroIndex, setHeroIndex] = useState(0)
  const featuredArticle = useMemo(() => ARTICLES[Math.floor(Math.random() * ARTICLES.length)], [])

  const heroImages = ['/assets/laba-1.jpg', '/assets/laba-2.jpg', '/assets/laba-5.jpg']

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroImages.length), 4500)
    return () => clearInterval(t)
  }, [])

  const handleBook = (category?: string) => {
    haptic?.impactOccurred('medium')
    navigate('/booking', category ? { state: { category } } : undefined)
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden grain-overlay" style={{ height: '92vw', maxHeight: 520 }}>
        {heroImages.map((src, i) => (
          <img key={src} src={src} alt="Studio"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1200 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}

        {/* Градиенты */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#0E0E0E]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-transparent to-transparent" style={{ height: '30%', top: 'auto', bottom: 0 }} />

        {/* Фиолетовое свечение */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #C17BFF 0%, transparent 70%)' }} />
        </div>

        {/* Логотип + название + tagline */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 pb-4">
          {user && (
            <p className="text-white/40 text-xs mb-5 tracking-wide">
              Привет, {user.first_name} 👋
            </p>
          )}
          <div className="logo-float mb-4">
            <img src="/assets/logo-laba.png" alt="Лаборатория"
              className="w-20 h-20 object-contain drop-shadow-[0_0_24px_rgba(193,123,255,0.8)]"
            />
          </div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight text-center uppercase mb-2">
            лаборатория
          </h1>
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase text-center mb-5">
            Студия · Санкт-Петербург
          </p>

          {/* Tagline */}
          <div className="text-center mb-7">
            <p className="font-display font-black text-xl text-white leading-snug">
              Создай готовый<br/>
              <span className="text-lily">трек за 8 часов</span>
            </p>
          </div>

          <button onClick={() => handleBook()}
            className="btn-lily px-10 py-3.5 text-base font-semibold rounded-2xl">
            Записаться
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 right-4 flex gap-1.5 z-10">
          {heroImages.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300
              ${i === heroIndex ? 'w-4 h-1.5 bg-[#C17BFF]' : 'w-1.5 h-1.5 bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="px-4 space-y-8 mt-2 relative z-20">

        {/* Артисты */}
        <ArtistsTicker />

        {/* Услуги — горизонтальный скролл */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Услуги</p>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleBook(cat.id)}
                className="flex-shrink-0 card-lab p-4 rounded-2xl text-left active:scale-95 transition-transform"
                style={{ minWidth: 140 }}
              >
                <div className="text-[#C17BFF] mb-3">{CAT_ICONS[cat.id]}</div>
                <div className="font-bold text-white text-sm mb-0.5">{cat.label}</div>
                <div className="text-[11px] text-white/40 mb-2">{CAT_DESC[cat.id]}</div>
                <div className="font-semibold text-[#C17BFF] text-sm">{CAT_RATES[cat.id]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Студия — превью */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Студия</p>
          <button
            onClick={() => { haptic?.selectionChanged(); navigate('/studios') }}
            className="w-full relative rounded-3xl overflow-hidden active:scale-[0.98] transition-transform"
            style={{ height: 180 }}
          >
            <img src={STUDIOS[0].images[1]} alt={STUDIOS[0].name}
              className="absolute inset-0 w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-0 p-5 flex flex-col justify-between">
              {/* Equipment chips */}
              <div className="flex flex-wrap gap-1.5">
                {['Manley', 'Neumann', 'PMC', 'UA Apollo'].map(b => (
                  <span key={b} className="text-[10px] font-medium px-2 py-0.5 rounded-full
                    bg-black/50 text-white/70 border border-white/10">
                    {b}
                  </span>
                ))}
              </div>
              <div>
                <div className="font-display font-black text-lg text-white mb-0.5">Лаборатория</div>
                <div className="text-sm text-white/50">Большой Сампсониевский 60Н · м. Выборгская</div>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#C17BFF]/20 border border-[#C17BFF]/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#C17BFF]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Статья */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Читать</p>
          <button
            onClick={() => { haptic?.impactOccurred('light'); navigate(`/media/${featuredArticle.id}`) }}
            className="w-full relative rounded-2xl overflow-hidden active:scale-[0.98] transition-all card-lab"
            style={{ height: 120 }}
          >
            <img src={featuredArticle.cover} alt={featuredArticle.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/60 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
                bg-[#C17BFF]/20 text-[#C17BFF] border border-[#C17BFF]/30 self-start">
                {featuredArticle.tag}
              </span>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{featuredArticle.title}</p>
                <p className="text-[10px] text-white/30 mt-1">{featuredArticle.readTime} мин чтения</p>
              </div>
            </div>
          </button>
        </div>

        {/* Info grid */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">О студии</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji: '📍', title: 'Адрес', sub: 'Бол. Сампсониевский 60Н' },
              { emoji: '🕐', title: 'Режим работы', sub: '0:00 — 24:00' },
              { emoji: '⚡', title: 'Предоплата', sub: '50% при бронировании' },
              { emoji: '🎙️', title: 'Оборудование', sub: 'Manley · SSL · UAD' },
            ].map(({ emoji, title, sub }) => (
              <div key={title} className="p-3.5 rounded-2xl card-lab">
                <div className="text-xl mb-2">{emoji}</div>
                <div className="text-xs font-semibold text-white">{title}</div>
                <div className="text-xs text-white/40 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
