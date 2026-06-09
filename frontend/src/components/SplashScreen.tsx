import { useEffect, useState } from 'react'

/** Equalizer bars — audio studio branding */
function EqBars() {
  const bars = [
    { h: 0.4, delay: '0s',    dur: '0.7s' },
    { h: 0.8, delay: '0.1s',  dur: '0.9s' },
    { h: 1.0, delay: '0.05s', dur: '0.6s' },
    { h: 0.6, delay: '0.15s', dur: '0.8s' },
    { h: 0.9, delay: '0s',    dur: '1.0s' },
    { h: 0.5, delay: '0.2s',  dur: '0.75s' },
    { h: 0.7, delay: '0.1s',  dur: '0.65s' },
  ]
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 32 }}>
      {bars.map((b, i) => (
        <div
          key={i}
          className="rounded-full bg-[#CC0066]"
          style={{
            width: 3,
            height: `${b.h * 32}px`,
            opacity: 0.7 + b.h * 0.3,
            animationName: 'eq-bar',
            animationDuration: b.dur,
            animationDelay: b.delay,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  )
}

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 300)
    const t2 = setTimeout(() => setPhase('exit'), 2200)
    const t3 = setTimeout(onDone, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0E0E0E] flex flex-col items-center justify-center overflow-hidden"
      style={{
        transition: phase === 'exit' ? 'opacity 0.5s cubic-bezier(0.45,0,0.55,1), transform 0.5s cubic-bezier(0.45,0,0.55,1)' : undefined,
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.05) translateY(-8px)' : 'scale(1)',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Background ambient glow — purple radial */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,0,102,0.12) 0%, transparent 65%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-ring 3s ease-in-out infinite',
        }}
      />

      {/* Second smaller glow ring */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,0,102,0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-ring 2s ease-in-out 0.5s infinite',
        }}
      />

      {/* Main content */}
      <div
        className="relative flex flex-col items-center"
        style={{
          animation: 'fadeUp 0.55s cubic-bezier(0.25,0.46,0.45,0.94) both',
        }}
      >
        {/* Sticker */}
        <div
          style={{
            width: 160,
            height: 160,
            marginBottom: 16,
            animation: 'float 3.5s ease-in-out infinite',
          }}
        >
          <img
            src="/assets/sticker.webp"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Equalizer bars */}
        <div style={{ animation: 'fadeIn 0.4s ease 0.25s both', opacity: 0, marginBottom: 24 }}>
          <EqBars />
        </div>

        {/* Studio name */}
        <h1
          className="font-display font-black text-[28px] tracking-[-0.02em] text-white"
          style={{ animation: 'text-reveal 0.55s cubic-bezier(0.25,0.46,0.45,0.94) 0.15s both', opacity: 0 }}
        >
          ЛАБОРАТОРИЯ
        </h1>

        {/* Subtitle */}
        <p
          className="text-[10px] font-semibold tracking-[0.32em] text-white/30 mt-2 uppercase"
          style={{ animation: 'text-reveal 0.55s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s both', opacity: 0 }}
        >
          Студия звукозаписи
        </p>
      </div>

      {/* Bottom loading dots */}
      <div
        className="absolute bottom-16 flex gap-2 items-center"
        style={{ animation: 'fadeIn 0.4s ease 0.9s both', opacity: 0 }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-full bg-[#CC0066]"
            style={{
              width: 4,
              height: 16,
              animationName: 'pulse-dot',
              animationDuration: '1s',
              animationDelay: `${i * 0.18}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>
    </div>
  )
}
