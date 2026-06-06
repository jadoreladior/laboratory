import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { ARTICLES } from '../data'
import { Clock3 } from 'lucide-react'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function Media() {
  const navigate = useNavigate()
  const { haptic } = useTelegram()

  const [featured, ...rest] = ARTICLES

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* Header */}
      <div className="px-4 pt-6 pb-5">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">Лаборатория</p>
        <h1 className="font-display text-2xl font-black text-white tracking-tight">Медиа</h1>
        <p className="text-sm text-white/40 mt-1">Интервью, гайды и истории из студии</p>
      </div>

      <div className="px-4 space-y-3 stagger">

        {/* Featured article */}
        <button
          onClick={() => { haptic?.impactOccurred('light'); navigate(`/media/${featured.id}`) }}
          className="w-full text-left rounded-2xl overflow-hidden card-lab active:scale-[0.98] transition-all"
        >
          <div className="relative h-52 w-full">
            <img
              src={featured.cover}
              alt={featured.title}
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Tag badge */}
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest
              px-2.5 py-1 rounded-full bg-[#C17BFF]/20 text-[#C17BFF] border border-[#C17BFF]/30 backdrop-blur-sm">
              {featured.tag}
            </span>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-base font-black text-white leading-tight">{featured.title}</h2>
              <p className="text-xs text-white/50 mt-1 line-clamp-2">{featured.subtitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-white/30">{formatDate(featured.date)}</span>
                <span className="text-white/15">·</span>
                <Clock3 size={10} className="text-white/30" />
                <span className="text-[10px] text-white/30">{featured.readTime} мин</span>
              </div>
            </div>
          </div>
        </button>

        {/* Rest of articles */}
        {rest.map(article => (
          <button
            key={article.id}
            onClick={() => { haptic?.impactOccurred('light'); navigate(`/media/${article.id}`) }}
            className="w-full flex gap-3 p-3 rounded-2xl card-lab active:scale-[0.98] transition-all text-left"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={article.cover}
                alt={article.title}
                className="w-full h-full object-cover opacity-80"
              />
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C17BFF]/70">
                {article.tag}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5 leading-tight line-clamp-2">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-white/25">{formatDate(article.date)}</span>
                <span className="text-white/15">·</span>
                <span className="text-[10px] text-white/25">{article.readTime} мин</span>
              </div>
            </div>
            <div className="flex items-center self-center flex-shrink-0">
              <svg className="w-4 h-4 text-white/15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>
        ))}

      </div>
    </div>
  )
}
