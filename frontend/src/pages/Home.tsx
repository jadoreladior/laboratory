import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { SERVICE_CATEGORIES } from '../data'
import { Mic2, Sliders, Key, Package, ChevronRight } from 'lucide-react'
import { ArtistsTicker } from '../components/ArtistsTicker'

const HERO_IMAGES = [
  '/photos/studio/main.jpg',
  '/photos/studio/2.jpg',
  '/photos/studio/3.jpg',
  '/photos/studio/4.jpg',
  '/photos/studio/5.jpg',
  '/photos/studio/6.jpg',
  '/photos/studio/7.jpg',
  '/photos/studio/8.jpg',
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
  record:  'Вокал · речитатив · живые инструменты',
  studio:  'На месте или дистанционно по исходникам',
  rent:    'Самостоятельная работа без инженера',
  package: 'Уходишь с готовым финальным треком',
}

// Координаты: Большой Сампсониевский пр., 60Н
const MAP_URL = 'https://yandex.ru/map-widget/v1/?ll=30.329416%2C59.964355&z=16&pt=30.329416%2C59.964355%2Cpm2rdm&l=map&lang=ru_RU'
const MAPS_OPEN = 'https://yandex.ru/maps/-/CHrJBP8T'

export function Home() {
  const { user, haptic } = useTelegram()
  const navigate = useNavigate()
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
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

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ height: '88vw', maxHeight: 480 }}>
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

        <div className="absolute inset-0 z-10"
          style={{ background: 'linear-gradient(to bottom, rgba(14,14,14,0.55) 0%, transparent 35%, transparent 55%, rgba(14,14,14,0.95) 100%)' }} />

        {/* Логотип + имя */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-5 flex items-center justify-between">
          <img src="/assets/logo-laba.png" alt="Лаборатория" className="w-9 h-9 object-contain" />
          {user && (
            <span className="text-[11px] text-white/40">{user.first_name}</span>
          )}
        </div>

        {/* Заголовок + CTA */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-5">
          <h1 className="font-display font-black text-3xl text-white leading-none tracking-tight mb-1">
            ЛАБОРАТОРИЯ
          </h1>
          <p className="text-white/50 text-sm tracking-widest uppercase mb-4">Санкт-Петербург</p>
          <button
            onClick={() => go()}
            className="btn-lily px-6 py-3 rounded-2xl font-bold text-white text-sm"
          >
            Записаться в студию
          </button>
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

      <div className="h-6" />

      <div className="px-4 space-y-8">

        {/* ── АРТИСТЫ ── */}
        <ArtistsTicker />

        {/* ── УСЛУГИ ── */}
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
                style={{ minWidth: 156 }}
              >
                <div className="w-9 h-9 rounded-xl bg-[#C17BFF]/10 flex items-center justify-center text-[#C17BFF] mb-3">
                  {CAT_ICONS[cat.id]}
                </div>
                <div className="font-bold text-white text-sm mb-1">{cat.label}</div>
                <div className="text-[10px] text-white/35 mb-3 leading-snug">{CAT_DESC[cat.id]}</div>
                <div className="font-bold text-[#C17BFF] text-sm">{CAT_RATES[cat.id]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── ФОТО-ГАЛЕРЕЯ ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Студия</p>
            <button onClick={() => navigate('/studios')} className="flex items-center gap-1 text-[11px] text-[#C17BFF] font-semibold">
              Все фото <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-2" style={{ height: 180 }}>
            <button
              onClick={() => navigate('/studios')}
              className="flex-1 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
            >
              <img src="/photos/studio/main.jpg" alt="" className="w-full h-full object-cover" />
            </button>
            <div className="flex flex-col gap-2" style={{ width: '38%' }}>
              <button
                onClick={() => navigate('/studios')}
                className="flex-1 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
              >
                <img src="/photos/studio/2.jpg" alt="" className="w-full h-full object-cover" />
              </button>
              <button
                onClick={() => navigate('/studios')}
                className="flex-1 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform relative"
              >
                <img src="/photos/studio/3.jpg" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+13</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── О СТУДИИ ── */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">О студии</p>

          {/* Статы: 4 плитки */}
          <div className="grid grid-cols-2 gap-2 mb-3 stagger">
            <div className="card-lab p-4 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-[#C17BFF]/10 flex items-center justify-center text-[#C17BFF] mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                <CountUp to={140} suffix=" м²" />
              </div>
              <div className="text-[11px] text-white/40 mt-1 leading-snug">Площадь студии</div>
            </div>

            <div className="card-lab p-4 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-[#C17BFF]/10 flex items-center justify-center text-[#C17BFF] mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm font-bold text-white leading-tight">Круглосуточно</div>
              <div className="text-[11px] text-white/40 mt-1 leading-snug">Ежедневно</div>
            </div>

            <div className="card-lab p-4 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-[#C17BFF]/10 flex items-center justify-center text-[#C17BFF] mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                <CountUp to={1500000} suffix=" ₽" duration={1400} />
              </div>
              <div className="text-[11px] text-white/40 mt-1 leading-snug">Парк оборудования</div>
            </div>

            <div className="card-lab p-4 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-[#C17BFF]/10 flex items-center justify-center text-[#C17BFF] mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm font-bold text-white leading-tight">Предоплата 50%</div>
              <div className="text-[11px] text-white/40 mt-1 leading-snug">Возврат при отмене</div>
            </div>
          </div>

          {/* Текстовая плашка */}
          <div className="px-4 py-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]">
            <p className="text-sm text-white/60 leading-relaxed">
              Студия с оборудованием, запрещённым к поставке санкциями. Инженеры со звукорежиссёрским образованием. LED-освещение, приточная вентиляция — без духоты и суеты.
            </p>
          </div>
        </div>

        {/* ── ЯНДЕКС КАРТА ── */}
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Как добраться</p>

          {/* Карта */}
          <div className="rounded-2xl overflow-hidden" style={{ height: 200 }}>
            <iframe
              src={MAP_URL}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="Лаборатория на карте"
              style={{ border: 'none', display: 'block' }}
            />
          </div>

          {/* Адрес + ссылка */}
          <a
            href={MAPS_OPEN}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#C17BFF]/10 flex items-center justify-center text-[#C17BFF] flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Большой Сампсониевский, 60Н</div>
                <div className="text-[11px] text-white/40 mt-0.5">м. Выборгская · Круглосуточно</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-white/25 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

      </div>

      {/* ── CTA ВНИЗУ ── */}
      <div className="px-4 mt-8 mb-2">
        <button
          onClick={() => { haptic?.impactOccurred('medium'); navigate('/studios') }}
          className="w-full btn-lily py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
          style={{ boxShadow: '0 8px 32px rgba(193,123,255,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          Записаться в студию
        </button>
      </div>

      <div className="h-2" />
    </div>
  )
}

/** Counts up from 0 → target when the element scrolls into view */
function CountUp({ to, suffix = '', duration = 1100 }: { to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const step = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            setCount(Math.floor(eased * to))
            if (t < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [to, duration])

  return <span ref={ref}>{count.toLocaleString('ru-RU')}{suffix}</span>
}
