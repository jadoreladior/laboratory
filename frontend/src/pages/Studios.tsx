import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { STUDIOS, TEAM } from '../data'
import { useTelegram } from '../hooks/useTelegram'
import { useBookingStore } from '../store/bookingStore'
import type { Studio } from '../types'

const EQUIPMENT_GROUPS = [
  {
    label: 'Микрофоны',
    items: ['Manley Reference Silver', 'Neumann TLM 67', 'Neumann U87', 'sE Electronics'],
  },
  {
    label: 'Мониторы',
    items: ['PMC IB1S-AIII', 'Yamaha NS-10', 'Audeze LCD-XC'],
  },
  {
    label: 'Обработка',
    items: ['Manley VOXBOX', 'Rupert Neve 511/535', 'UA Apollo x6', 'SSL Fusion'],
  },
  {
    label: 'Цифровое',
    items: ['Avid Pro Tools', 'iZotope RX', 'UAD plug-ins'],
  },
]

const BRANDS = ['Manley', 'Neumann', 'PMC', 'UA', 'Rupert Neve', 'Avid', 'Audeze', 'SSL']

export function Studios() {
  const [selected, setSelected] = useState<Studio | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [activeGroup, setActiveGroup] = useState(0)
  const navigate = useNavigate()
  const { haptic } = useTelegram()
  const { setStudio } = useBookingStore()
  const touchStartX = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  return (
    <div className="pb-nav animate-fade-in bg-[#0E0E0E] min-h-screen">

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">Лаборатория</p>
        <h1 className="font-display text-2xl font-black text-white tracking-tight">Студия</h1>
        <p className="text-sm text-white/40 mt-1">Оборудование на 1 500 000 ₽</p>
      </div>

      {/* Hero studio card */}
      <div className="px-4 mb-6">
        <button
          onClick={() => openStudio(STUDIOS[0])}
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
          <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#C17BFF]/25 border border-[#C17BFF]/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#C17BFF]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Equipment brands */}
      <div className="px-4 mb-6">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Бренды</p>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map(brand => (
            <div key={brand}
              className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-sm font-semibold text-white/70">
              {brand}
            </div>
          ))}
        </div>
      </div>

      {/* Equipment by category */}
      <div className="px-4 mb-6">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Оборудование</p>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mb-4">
          {EQUIPMENT_GROUPS.map((g, i) => (
            <button
              key={g.label}
              onClick={() => { haptic?.selectionChanged(); setActiveGroup(i) }}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all
                ${activeGroup === i
                  ? 'bg-[#C17BFF]/15 text-[#C17BFF] border border-[#C17BFF]/30'
                  : 'bg-[#1A1A1A] text-white/50 border border-[#2A2A2A]'}`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="card-lab overflow-hidden">
          {EQUIPMENT_GROUPS[activeGroup].items.map((item, i) => (
            <div key={item} className={`flex items-center gap-3 px-4 py-3.5
              ${i < EQUIPMENT_GROUPS[activeGroup].items.length - 1 ? 'border-b border-[#2A2A2A]' : ''}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#C17BFF] flex-shrink-0" />
              <span className="text-sm text-white">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photo gallery */}
      <div className="px-4 mb-4">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Фото студии</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STUDIOS[0].images.map((src, i) => (
            <button
              key={src}
              onClick={() => openStudio(STUDIOS[0])}
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
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Команда</p>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {TEAM.map(member => (
            <div key={member.id} className="flex-shrink-0 card-lab rounded-2xl overflow-hidden" style={{ width: 140 }}>
              <div className="relative" style={{ height: 160 }}>
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              </div>
              <div className="p-3">
                <div className="font-bold text-white text-xs leading-tight">{member.name}</div>
                <div className="text-[10px] text-[#C17BFF] mt-0.5">{member.role}</div>
                <div className="text-[10px] text-white/35 mt-1 leading-snug">{member.specialization}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mt-2">
        <button
          onClick={() => { haptic?.impactOccurred('medium'); setStudio('A'); navigate('/booking') }}
          className="btn-lily w-full py-4 rounded-2xl font-bold text-white text-base"
        >
          Записаться в студию
        </button>
      </div>

      {/* ── Bottom sheet ── */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={close}
            onTouchMove={e => e.preventDefault()}
          />
          <div
            className="fixed left-0 right-0 bottom-0 z-40 bg-[#111111] border-t border-[#2A2A2A] rounded-t-3xl flex flex-col animate-slide-up"
            style={{ maxHeight: '90vh' }}
          >
            {/* Photo gallery */}
            <div
              className="relative flex-shrink-0 rounded-t-3xl overflow-hidden"
              style={{ height: '52vw', minHeight: 180, maxHeight: 240 }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {selected.images.map((src, i) => (
                <img key={src} src={src} alt={selected.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === photoIndex ? 'opacity-100' : 'opacity-0'}`} />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center z-10">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {selected.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {selected.images.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className={`transition-all duration-300 rounded-full
                        ${i === photoIndex ? 'w-4 h-1.5 bg-[#C17BFF]' : 'w-1.5 h-1.5 bg-white/25'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable info */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-5"
              style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="font-display text-xl font-black text-white">{selected.name}</h2>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected.color, boxShadow: `0 0 8px ${selected.color}` }} />
              </div>

              <a href="https://yandex.ru/maps/-/CHrJBP8T" target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[#C17BFF]/70 text-xs mb-3 active:opacity-70">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Большой Сампсониевский 60Н · м. Выборгская
              </a>

              <p className="text-sm text-white/50 leading-relaxed mb-4">{selected.description}</p>

              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">Оборудование</p>
              <div className="flex flex-wrap gap-1.5 mb-6">
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
        </>
      )}
    </div>
  )
}
