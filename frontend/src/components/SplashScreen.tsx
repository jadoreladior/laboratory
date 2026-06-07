import { useEffect, useRef, useState } from 'react'

const SPLASH_VIDEO = '/assets/splash.mp4'

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
          className="rounded-full bg-[#C17BFF]"
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
  const [videoOk, setVideoOk] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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
          background: 'radial-gradient(circle, rgba(193,123,255,0.12) 0%, transparent 65%)',
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
          background: 'radial-gradient(circle, rgba(193,123,255,0.08) 0%, transparent 70%)',
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
        {/* Video (или mic-иконка как fallback) */}
        <div
          className="mb-6 relative"
          style={{
            width: 160,
            height: 160,
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(193,123,255,0.35), 0 0 80px rgba(193,123,255,0.15)',
            animation: videoOk ? undefined : 'float 3.5s ease-in-out infinite',
          }}
        >
          {/* Видео */}
          <video
            ref={videoRef}
            src={SPLASH_VIDEO}
            autoPlay
            muted
            playsInline
            loop
            onCanPlay={() => setVideoOk(true)}
            onError={() => setVideoOk(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: videoOk ? 'block' : 'none',
            }}
          />

          {/* Fallback: mic SVG если видео не загрузилось */}
          {!videoOk && (
            <div
              className="w-full h-full flex items-center justify-center bg-[#1A1A1A]"
              style={{ filter: 'drop-shadow(0 0 20px rgba(193,123,255,0.55))' }}
            >
              <svg width={52} height={52} viewBox="0 0 24 24" fill="none"
                stroke="#C17BFF" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
            </div>
          )}

          {/* Фиолетовый оверлей поверх видео */}
          {videoOk && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(193,123,255,0.08) 0%, rgba(14,14,14,0.25) 100%)',
              }}
            />
          )}
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
          Звукозаписывающая студия
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
            className="rounded-full bg-[#C17BFF]"
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
