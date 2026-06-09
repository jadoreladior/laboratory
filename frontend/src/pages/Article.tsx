import { useParams, useNavigate } from 'react-router-dom'
import { ARTICLES } from '../data'
import { ChevronLeft, Clock3 } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'
import type { ArticleBlock } from '../types'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Block({ block }: { block: ArticleBlock }) {
  if (block.type === 'paragraph') {
    return (
      <p className="text-sm text-white/70 leading-relaxed">
        {block.text}
      </p>
    )
  }
  if (block.type === 'heading') {
    return (
      <h3 className="text-base font-bold text-white mt-2">
        {block.text}
      </h3>
    )
  }
  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-2 border-[#CC0066]/40 pl-4 my-1">
        <p className="text-sm text-white/50 italic leading-relaxed">
          «{block.text}»
        </p>
      </blockquote>
    )
  }
  if (block.type === 'qa') {
    return (
      <div className="card-lab p-4 space-y-2">
        <p className="text-sm font-semibold text-white">
          — {block.question}
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          {block.answer}
        </p>
      </div>
    )
  }
  return null
}

export function Article() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { haptic } = useTelegram()

  const article = ARTICLES.find(a => a.id === id)

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0E0E0E] px-6">
        <p className="text-white/30 text-sm">Статья не найдена</p>
        <button
          onClick={() => navigate('/media')}
          className="mt-4 text-sm text-[#CC0066] underline"
        >
          Вернуться
        </button>
      </div>
    )
  }

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* Hero cover */}
      <div className="relative h-64 w-full">
        <img
          src={article.cover}
          alt={article.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-black/40 to-black/40" />

        {/* Back */}
        <button
          onClick={() => { haptic?.impactOccurred('light'); navigate(-1) }}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 border border-white/10
            flex items-center justify-center z-10 backdrop-blur-sm"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>

        {/* Tag */}
        <span className="absolute top-4 right-4 text-[10px] font-bold
          px-2.5 py-1 rounded-full bg-[#CC0066]/20 text-[#CC0066] border border-[#CC0066]/30 backdrop-blur-sm">
          {article.tag}
        </span>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="font-display text-xl font-black text-white leading-tight">{article.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-white/40">{formatDate(article.date)}</span>
            <span className="text-white/15">·</span>
            <Clock3 size={10} className="text-white/30" />
            <span className="text-xs text-white/40">{article.readTime} мин чтения</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-4">
        <p className="text-sm text-white/40 leading-relaxed italic">
          {article.subtitle}
        </p>

        <div className="w-8 h-px bg-[#CC0066]/20" />

        {article.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        <div className="pt-4 pb-2">
          <button
            onClick={() => { haptic?.impactOccurred('light'); navigate('/media') }}
            className="flex items-center gap-1.5 text-sm text-white/30 hover:text-[#CC0066] transition-colors"
          >
            <ChevronLeft size={16} />
            Все материалы
          </button>
        </div>
      </div>
    </div>
  )
}
