import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { STUDIOS, TEAM, STUDIO_RULES, EQUIPMENT_ITEMS } from '../data'
import { useTelegram } from '../hooks/useTelegram'
import { useBookingStore } from '../store/bookingStore'
import type { Studio } from '../types'

type TeamMember = typeof TEAM[number]
type EquipmentItem = typeof EQUIPMENT_ITEMS[number]

/** Рендерит текст с **акцентом** — выделяет фиолетовым жирным */
function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <span key={i} className="text-[#CC0066] font-semibold">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

const RULE_ICONS: Record<string, React.ReactNode> = {
  payment: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M2 10h20"/>
    </svg>
  ),
  smoke: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M18 12h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3"/>
      <path d="M18 8c0-2.5-2-2.5-2-5"/>
      <path d="M14 8c0-2.5-2-2.5-2-5"/>
      <line x1="3" y1="1" x2="21" y2="23" strokeDasharray="0"/>
    </svg>
  ),
  drink: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M8 22h8M12 11v11M5 3l2 7h10l2-7H5z"/>
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  camera: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  ban: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
}

function EquipmentPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-[#CC0066]/10 border border-[#CC0066]/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-[#CC0066]/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      </div>
      <p className="absolute bottom-4 text-[11px] text-white/20">Фото появится позже</p>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export function Studios() {
  const [selected, setSelected] = useState<Studio | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [activeGroup, setActiveGroup] = useState(0)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const navigate = useNavigate()
  const { haptic } = useTelegram()
  const { setStudio } = useBookingStore()
  const touchStartX = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Group equipment by category
  const equipmentGroups = useMemo(() => {
    const cats = [...new Set(EQUIPMENT_ITEMS.map(i => i.category))]
    return cats.map(cat => ({
      label: cat,
      items: EQUIPMENT_ITEMS.filter(i => i.category === cat),
    }))
  }, [])

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  useEffect(() => {
    if (!selected) return
    intervalRef.current = setInterval(() => {
      setPhotoIndex(i => (i + 1) % selected.images.length)
    }, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [selected])

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!selected) return
    intervalRef.current = setInterval(() => {
      setPhotoIndex(i => (i + 1) % selected.images.length)
    }, 3000)
  }

  const openStudio = (studio: Studio) => {
    haptic?.impactOccurred('light')
    setSelected(studio)
    setPhotoIndex(0)
  }

  const close = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSelected(null)
  }

  const goTo = (i: number) => { setPhotoIndex(i); resetInterval() }

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!selected) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) setPhotoIndex(i => (i + 1) % selected.images.length)
      else setPhotoIndex(i => (i - 1 + selected.images.length) % selected.images.length)
      resetInterval()
    }
  }

  const lbTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const lbTouchEnd = (e: React.TouchEvent) => {
    if (!lightbox) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb)
      else setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb)
    }
  }

  const playTrack = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playingTrack === url) { setPlayingTrack(null); return }
    const audio = new Audio(url)
    audio.play().catch(() => {})
    audio.onended = () => setPlayingTrack(null)
    audioRef.current = audio
    setPlayingTrack(url)
  }

  const closeMember = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setPlayingTrack(null)
    setSelectedMember(null)
  }

  return (
    <div
      className="animate-fade-in bg-[#0E0E0E] flex flex-col"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-xs font-medium text-white/40 mb-1">Лаборатория</p>
        <h1 className="font-display text-2xl font-black text-white tracking-tight">Студия</h1>
        <p className="text-sm text-white/40 mt-1">Оборудование на 2 500 000 ₽</p>
      </div>

      {/* Hero studio card */}
      <div className="px-4 mb-6">
        <button
          onClick={() => { haptic?.impactOccurred('light'); setLightbox({ images: STUDIOS[0].images, index: 0 }) }}
          className="w-full text-left rounded-3xl overflow-hidden active:scale-[0.98] transition-transform relative"
          style={{ height: 220 }}
        >
          <img src={STUDIOS[0].images[0]} alt={STUDIOS[0].name}
            className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <img src="/assets/logo-laba.png" alt="logo" className="w-8 h-8 object-contain" />
              <span className="font-display font-black text-sm text-white uppercase tracking-wider">Лаборатория</span>
            </div>
            <div>
              <div className="text-white/60 text-xs mb-2">СПб · Большой Сампсониевский 60Н</div>
              <div className="flex flex-wrap gap-1.5">
                {['140 м² LED', 'Вентиляция', 'Звукоизоляция'].map(f => (
                  <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#CC0066]/25 border border-[#CC0066]/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#CC0066]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Rules */}
      <div className="px-4 mb-6">
        <p className="text-xs font-medium text-white/40 mb-3">Правила</p>
        <div className="card-lab overflow-hidden">
          {STUDIO_RULES.map((rule, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3.5
                ${i < STUDIO_RULES.length - 1 ? 'border-b border-[#2A2A2A]' : ''}`}
            >
              <span className="flex-shrink-0 text-[#CC0066]/70 mt-0.5">{RULE_ICONS[rule.icon]}</span>
              <RichText text={rule.text} className="text-sm text-white/75 leading-snug" />
            </div>
          ))}
        </div>
      </div>

      {/* Equipment by category */}
      <div className="px-4 mb-6">
        <p className="text-xs font-medium text-white/40 mb-3">Оборудование</p>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mb-4">
          {equipmentGroups.map((g, i) => (
            <button
              key={g.label}
              onClick={() => { haptic?.selectionChanged(); setActiveGroup(i) }}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all
                ${activeGroup === i
                  ? 'bg-[#CC0066]/15 text-[#CC0066] border border-[#CC0066]/30'
                  : 'bg-[#1A1A1A] text-white/50 border border-[#2A2A2A]'}`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Items — clickable */}
        <div className="card-lab overflow-hidden">
          {equipmentGroups[activeGroup]?.items.map((item, i, arr) => (
            <button
              key={item.id}
              onClick={() => { haptic?.impactOccurred('light'); setSelectedEquipment(item) }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors
                ${i < arr.length - 1 ? 'border-b border-[#2A2A2A]' : ''}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#CC0066] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">{item.name}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{item.tag}</div>
              </div>
              <svg className="w-4 h-4 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Photo gallery */}
      <div className="px-4 mb-4">
        <p className="text-xs font-medium text-white/40 mb-3">Фото студии</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STUDIOS[0].images.map((src, i) => (
            <button
              key={src}
              onClick={() => { haptic?.impactOccurred('light'); setLightbox({ images: STUDIOS[0].images, index: i }) }}
              className="flex-shrink-0 rounded-2xl overflow-hidden active:scale-95 transition-transform"
              style={{ width: 120, height: 90 }}
            >
              <img src={src} alt={`Студия ${i+1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Команда */}
      <div className="px-4 mb-6">
        <p className="text-xs font-medium text-white/40 mb-3">Команда</p>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {TEAM.map(member => (
            <button
              key={member.id}
              onClick={() => { haptic?.impactOccurred('light'); setSelectedMember(member) }}
              className="flex-shrink-0 card-lab rounded-2xl overflow-hidden active:scale-95 transition-transform text-left"
              style={{ width: 140 }}
            >
              <div className="relative" style={{ height: 160, overflow: 'hidden' }}>
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#CC0066]/20 border border-[#CC0066]/40 flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#CC0066]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="p-3">
                <div className="font-bold text-white text-xs leading-tight">{member.name}</div>
                <div className="text-[10px] text-[#CC0066] font-semibold mt-0.5">{member.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* bottom padding inside scroll area */}
      <div style={{ height: 16 }} />
    </div>{/* end scrollable */}

    {/* ── Pinned CTA (flex child, always visible above nav) ── */}
    <div
      className="flex-shrink-0 px-4 bg-[#0E0E0E]"
      style={{
        paddingTop: 10,
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 10px)',
        borderTop: '1px solid #1A1A1A',
      }}
    >
      <button
        onClick={() => { haptic?.impactOccurred('medium'); setStudio('A'); navigate('/booking') }}
        className="btn-lily w-full py-4 rounded-2xl font-bold text-white text-base"
        style={{ boxShadow: '0 8px 32px rgba(204,0,102,0.45), 0 2px 8px rgba(0,0,0,0.5)' }}
      >
        Записаться в студию
      </button>
    </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <>
          {/* Blurred backdrop — tap to close */}
          <div
            className="fixed inset-0 z-50"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
            onClick={() => setLightbox(null)}
          />

          {/* Flex centering wrapper — pointer-events-none so taps pass to backdrop */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
              paddingLeft: 16, paddingRight: 16,
              paddingTop: 'env(safe-area-inset-top, 16px)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Modal card — re-enable pointer events */}
            <div
              className="animate-scale-in w-full flex flex-col pointer-events-auto"
              style={{ maxWidth: 480 }}
              onTouchStart={lbTouchStart}
              onTouchEnd={lbTouchEnd}
              onTouchMove={e => e.stopPropagation()}
            >
              {/* Image container */}
              <div
                className="relative rounded-3xl overflow-hidden w-full"
                style={{ height: 'min(72vw, 52svh)', minHeight: 200, background: '#111' }}
              >
                {lightbox.images.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Студия ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                    style={{ opacity: i === lightbox.index ? 1 : 0 }}
                  />
                ))}

                {/* Close */}
                <button
                  onClick={() => setLightbox(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10 active:scale-90 transition-transform"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Counter */}
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white/80 text-xs font-medium"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                >
                  {lightbox.index + 1} / {lightbox.images.length}
                </div>

                {/* Prev / Next */}
                <button
                  onClick={() => setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Dots below image */}
              <div className="flex justify-center gap-1.5 mt-3">
                {lightbox.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(lb => lb ? { ...lb, index: i } : lb)}
                    className={`transition-all duration-300 rounded-full ${i === lightbox.index ? 'w-4 h-1.5 bg-[#CC0066]' : 'w-1.5 h-1.5 bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Studio detail modal ── */}
      {selected && (
        <>
          {/* Blurred backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
            onClick={close}
          />

          {/* Flex centering wrapper */}
          <div
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            style={{
              paddingLeft: 16, paddingRight: 16,
              paddingTop: 'env(safe-area-inset-top, 16px)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
          {/* Modal card */}
          <div
            className="animate-scale-in flex flex-col pointer-events-auto w-full"
            style={{
              maxWidth: 440,
              maxHeight: 'calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 80px)',
              background: '#161616',
              border: '1px solid #2A2A2A',
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            {/* Photo strip */}
            <div
              className="relative flex-shrink-0 overflow-hidden"
              style={{ height: 200 }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {selected.images.map((src, i) => (
                <img key={src} src={src} alt={selected.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === photoIndex ? 'opacity-100' : 'opacity-0'}`} />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              {/* Close */}
              <button onClick={close}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Dots */}
              {selected.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {selected.images.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className={`transition-all duration-300 rounded-full
                        ${i === photoIndex ? 'w-4 h-1.5 bg-[#CC0066]' : 'w-1.5 h-1.5 bg-white/25'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Info — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5" style={{ overscrollBehavior: 'contain' }}>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="font-display text-xl font-black text-white">{selected.name}</h2>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected.color, boxShadow: `0 0 8px ${selected.color}` }} />
              </div>

              <button
                onClick={() => {
                  const url = 'https://yandex.ru/maps/?ll=30.329416,59.964355&z=17&pt=30.329416,59.964355,pm2rdm'
                  const tg = (window as any).Telegram?.WebApp
                  if (tg?.openLink) tg.openLink(url)
                  else window.open(url, '_blank')
                }}
                className="flex items-center gap-1.5 text-[#CC0066]/70 text-xs mb-3 active:opacity-70">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Большой Сампсониевский 60Н · м. Выборгская
              </button>

              <p className="text-sm text-white/50 leading-relaxed mb-4">{selected.description}</p>

              <p className="text-[10px] font-semibold text-white/25 mb-2">Оборудование</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {selected.features.map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium border"
                    style={{ backgroundColor: selected.color + '18', color: selected.color, borderColor: selected.color + '40' }}>
                    {f}
                  </span>
                ))}
              </div>

              <button
                onClick={() => { if (selected) setStudio(selected.id); close(); navigate('/booking') }}
                className="btn-lily w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-transform"
              >
                Записаться
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* ── Engineer modal ── */}
      {selectedMember && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
            onClick={closeMember}
          />
          {/* Flex centering wrapper */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
              paddingLeft: 16, paddingRight: 16,
              paddingTop: 'env(safe-area-inset-top, 16px)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
          <div
            className="animate-scale-in flex flex-col pointer-events-auto w-full"
            style={{
              maxWidth: 420,
              maxHeight: 'calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 80px)',
              background: '#161616',
              border: '1px solid #2A2A2A',
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            {/* Photo */}
            <div className="relative flex-shrink-0" style={{ height: 200 }}>
              <img src={selectedMember.photo} alt={selectedMember.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: selectedMember.photoPosition ?? 'center top' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-black/20 to-transparent" />
              <button onClick={closeMember}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-5">
                <div className="font-display font-black text-white text-lg leading-tight">{selectedMember.name}</div>
                <div className="text-[#CC0066] text-xs mt-1 font-semibold">{selectedMember.role}</div>
                <div className="text-white/40 text-[10px] mt-0.5">{selectedMember.specialization}</div>
              </div>
            </div>

            {/* Info + tracks */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              <p className="text-sm text-white/55 leading-relaxed mb-4">{selectedMember.bio}</p>

              {/* Facts / achievements */}
              {(selectedMember as any).facts?.length > 0 && (
                <div className="space-y-2 mb-5">
                  {(selectedMember as any).facts.map((fact: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#CC0066] flex-shrink-0" />
                      <span className="text-xs text-white/60 leading-snug">{fact}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedMember.tracks && selectedMember.tracks.length > 0 && (
                <>
                  <p className="text-xs font-medium text-white/40 mb-3">Работы</p>
                  <div className="space-y-2 mb-5">
                    {selectedMember.tracks.map((track, i) => {
                      const isPlaying = playingTrack === track.url
                      return (
                        <button
                          key={i}
                          onClick={() => playTrack(track.url)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-[0.98]
                            ${isPlaying ? 'bg-[#CC0066]/15 border border-[#CC0066]/30' : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                            ${isPlaying ? 'bg-[#CC0066]' : 'bg-[#2A2A2A]'}`}>
                            {isPlaying ? (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1"/>
                                <rect x="14" y="4" width="4" height="16" rx="1"/>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-medium ${isPlaying ? 'text-[#CC0066]' : 'text-white'}`}>
                              {track.title}
                            </div>
                            {isPlaying && (
                              <div className="flex gap-0.5 mt-1">
                                {[1,2,3,4,5].map(b => (
                                  <div key={b} className="w-0.5 rounded-full bg-[#CC0066]"
                                    style={{ height: Math.random() * 12 + 4, animation: `pulse-ring ${0.4 + b * 0.1}s ease infinite alternate` }} />
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  closeMember()
                  setStudio('A')
                  navigate('/booking', { state: { engineer: selectedMember.id, category: 'record', skipToDatetime: true } })
                }}
                className="btn-lily w-full py-3.5 rounded-2xl font-bold text-white text-sm"
              >
                Записаться к {selectedMember.name.split(' ')[0]}
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* ── Equipment detail modal ── */}
      {selectedEquipment && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
            onClick={() => setSelectedEquipment(null)}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
              paddingLeft: 16, paddingRight: 16,
              paddingTop: 'env(safe-area-inset-top, 16px)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            <div
              className="animate-scale-in flex flex-col pointer-events-auto w-full"
              style={{
                maxWidth: 420,
                maxHeight: 'calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 80px)',
                background: '#161616',
                border: '1px solid #2A2A2A',
                borderRadius: 24,
                overflow: 'hidden',
              }}
            >
              {/* Photo */}
              <div className="relative flex-shrink-0 bg-[#111]" style={{ height: 220 }}>
                <EquipmentPhoto src={selectedEquipment.photo} alt={selectedEquipment.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent pointer-events-none" />
                {/* Close */}
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(204,0,102,0.2)', color: '#CC0066', border: '1px solid rgba(204,0,102,0.35)', backdropFilter: 'blur(8px)' }}>
                  {selectedEquipment.category}
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex-1 min-h-0 overflow-y-auto">
                <div className="mb-1">
                  <h2 className="font-display font-black text-white text-lg leading-tight">{selectedEquipment.name}</h2>
                  <p className="text-[11px] text-[#CC0066]/70 mt-1">{selectedEquipment.tag}</p>
                </div>
                <div className="w-8 h-px bg-[#2A2A2A] my-3" />
                <p className="text-sm text-white/60 leading-relaxed">{selectedEquipment.description}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
