import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { STUDIOS, ARTICLES } from '../data'
import { MapPin, Clock3, Zap, Mic2 } from 'lucide-react'
import { ArtistsTicker } from '../components/ArtistsTicker'

export function Home() {
  const { user, haptic } = useTelegram()
  const navigate = useNavigate()
  const [heroIndex, setHeroIndex] = useState(0)
  const featuredArticle = useMemo(() => ARTICLES[Math.floor(Math.random() * ARTICLES.length)], [])

  const heroImages = ['/assets/laba-1.jpg', '/assets/laba-2.jpg', '/assets/laba-5.jpg']

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroImages.length), 4000)
    return () => clearInterval(t)
  }, [])

  const handleBook = () => {
    haptic?.impactOccurred('medium')
    navigate('/booking')
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden grain-overlay" style={{ minHeight: '80vw', maxHeight: 440 }}>
        {heroImages.map((src, i) => (
          <img key={src} src={src} alt="Studio"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}

        {/* Градиент поверх фото */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-[#0E0E0E]" />

        {/* Фиолетовое свечение */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #C17BFF 0%, transparent 70%)' }} />
        </div>

        {/* Логотип + название */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
          <div className="logo-float mb-4">
            <img src="/assets/logo-laba.png" alt="Лаборатория"
              className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(193,123,255,0.7)]"
            />
          </div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight text-center uppercase">
            лаборатория
          </h1>
          <p className="text-white/40 text-xs tracking-[0.25em] uppercase mt-1.5 text-center">
            Студия · Санкт-Петербург
          </p>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 right-4 flex gap-1.5 z-10">
          {heroImages.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300
              ${i === heroIndex ? 'w-4 h-1.5 bg-[#C17BFF]' : 'w-1.5 h-1.5 bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="px-4 space-y-7 -mt-1 relative z-20">

        {/* Приветствие + CTA */}
        <div>
          {user && (
            <p className="text-white/40 text-sm mb-1">
              Привет, {user.first_name} 👋
            </p>
          )}
          <h2 className="font-display text-xl font-black text-white mb-5 leading-tight">
            Твой звук.<br/>
            <span className="text-lily">Наша студия.</span>
          </h2>

          <button onClick={handleBook}
            className="btn-lily w-full py-4 text-base font-semibold rounded-2xl relative overflow-hidden">
            <span className="relative z-10">Записаться на сессию</span>
          </button>
        </div>

        {/* Артисты */}
        <ArtistsTicker />

        {/* Статья */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Читать</p>
          <button
            onClick={() => { haptic?.impactOccurred('light'); navigate(`/media/${featuredArticle.id}`) }}
            className="w-full relative rounded-2xl overflow-hidden active:scale-[0.98] transition-all card-lab border border-[#2A2A2A]"
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
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock3 size={10} className="text-white/30" />
                  <span className="text-[10px] text-white/30">{featuredArticle.readTime} мин</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Залы */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Наши залы</p>
          <div className="space-y-2 stagger">
            {STUDIOS.map((studio) => (
              <button key={studio.id}
                onClick={() => { haptic?.selectionChanged(); navigate('/studios') }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl card-lab
                  active:scale-[0.98] transition-all hover:border-[#C17BFF]/30">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{studio.name}</div>
                  <div className="text-xs text-white/40 mt-0.5 truncate">{studio.tagline}</div>
                  {studio.features && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {studio.features.slice(0, 2).map((f: string) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 rounded-full font-medium
                          bg-white/5 text-white/50 border border-white/8">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-7 h-7 rounded-full bg-[#C17BFF]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-[#C17BFF]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Инфо */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">О студии</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <MapPin size={16} strokeWidth={1.5} />, title: 'Адрес', sub: 'Гороховая 70' },
              { icon: <Clock3 size={16} strokeWidth={1.5} />, title: 'Режим работы', sub: '0:00 — 24:00' },
              { icon: <Zap size={16} strokeWidth={1.5} />, title: 'Предоплата', sub: '50% при записи' },
              { icon: <Mic2 size={16} strokeWidth={1.5} />, title: 'Оборудование', sub: 'Manley, SSL, UAD' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="p-3.5 rounded-2xl card-lab">
                <div className="text-[#C17BFF] mb-2">{icon}</div>
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
