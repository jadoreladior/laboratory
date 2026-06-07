import { NavLink, useLocation } from 'react-router-dom'
import { useAppContext } from '../App'
import { useState, useEffect, useRef } from 'react'

// CSS filter: white PNG → #C17BFF (purple)
const PURPLE_FILTER = 'brightness(0) invert(65%) sepia(48%) saturate(1053%) hue-rotate(223deg) brightness(103%)'

const baseTabs = [
  { to: '/',        navKey: 'home',    label: 'Главная' },
  { to: '/studios', navKey: 'studios', label: 'Студия'  },
  { to: '/profile', navKey: 'profile', label: 'Профиль' },
]

export function BottomNav() {
  const { isAdmin, pendingCount } = useAppContext()
  const [hidden, setHidden] = useState(false)
  const location = useLocation()
  const pillRef  = useRef<HTMLDivElement>(null)
  const navRef   = useRef<HTMLElement>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const initialHeight = vv.height
    const onResize = () => setHidden(vv.height < initialHeight * 0.85)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  const tabs = isAdmin
    ? [...baseTabs, { to: '/admin', navKey: 'admin', label: 'Админ' }]
    : baseTabs

  // Animate pill indicator to active tab
  useEffect(() => {
    if (!pillRef.current || !navRef.current) return
    const activeIdx = tabs.findIndex(t =>
      t.to === '/' ? location.pathname === '/' : location.pathname.startsWith(t.to)
    )
    if (activeIdx < 0) return
    const tabW = navRef.current.offsetWidth / tabs.length
    const x    = activeIdx * tabW + tabW / 2
    pillRef.current.style.transform = `translateX(${x}px)`
  }, [location.pathname, tabs.length])

  if (hidden) return null

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 bottom-nav-height z-50
        bg-[#0E0E0E]/95 border-t border-[#2A2A2A]
        flex items-start pt-2 overflow-hidden"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* Sliding top indicator */}
      <div
        ref={pillRef}
        className="absolute top-0 -translate-x-1/2 pointer-events-none"
        style={{ transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div
          className="rounded-full"
          style={{
            width: 32,
            height: 2,
            background: 'linear-gradient(90deg, #C17BFF, #E0A0FF)',
            boxShadow: '0 0 8px rgba(193,123,255,0.8)',
            marginLeft: -16,
          }}
        />
      </div>

      {tabs.map(({ to, navKey, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex-1 flex flex-col items-center gap-1 py-1"
        >
          {({ isActive }) => (
            <>
              <div
                className="relative flex items-center justify-center"
                style={{
                  transform: isActive ? 'scale(1.14)' : 'scale(1)',
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full bg-[#C17BFF]/20 blur-md scale-[2.2]"
                    style={{ animation: 'fadeIn 0.3s ease both' }}
                  />
                )}
                <img
                  src={`/icons/nav-${navKey}.png`}
                  width={22}
                  height={22}
                  alt={label}
                  draggable={false}
                  style={{
                    objectFit: 'contain',
                    filter: isActive ? PURPLE_FILTER : undefined,
                    opacity: isActive ? 1 : 0.3,
                    transition: 'opacity 0.22s ease, filter 0.22s ease',
                  }}
                />
                {to === '/admin' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5
                    rounded-full bg-[#FF4B4B] text-white text-[9px] font-bold
                    flex items-center justify-center leading-none animate-pop-in">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive ? '#C17BFF' : 'rgba(255,255,255,0.35)',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  transition: 'color 0.22s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
