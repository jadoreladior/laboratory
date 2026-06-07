import { useEffect, createContext, useContext, useState, useRef } from 'react'
import { initMotionBlur } from './utils/motionBlur'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTelegram } from './hooks/useTelegram'
import { BottomNav } from './components/BottomNav'
import { SplashScreen } from './components/SplashScreen'
import { Home } from './pages/Home'
import { Studios } from './pages/Studios'
import { Booking } from './pages/Booking'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { Media } from './pages/Media'
import { Article } from './pages/Article'
import { upsertUser, getAdminBookings, api } from './api'

const OWNER_IDS = (import.meta.env.VITE_ADMIN_IDS ?? '')
  .split(',')
  .map((x: string) => Number(x.trim()))
  .filter(Boolean)

type UserRole = 'user' | 'staff' | 'owner'

interface AppCtx {
  telegramId: number | null
  role: UserRole
  isAdmin: boolean
  isOwner: boolean
  pendingCount: number
  refreshPending: () => void
}

const AppContext = createContext<AppCtx>({
  telegramId: null, role: 'user',
  isAdmin: false, isOwner: false,
  pendingCount: 0, refreshPending: () => {},
})
export const useAppContext = () => useContext(AppContext)

export function App() {
  const { user } = useTelegram()
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [role, setRole] = useState<UserRole>('user')
  const [pendingCount, setPendingCount] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const mbCleanup = useRef<(() => void) | null>(null)

  const isOwner = role === 'owner'
  const isAdmin = role === 'owner' || role === 'staff'

  const refreshPending = () => {
    if (!isAdmin) return
    getAdminBookings()
      .then((data: any[]) => setPendingCount(data.filter((b: any) => b.status === 'pending').length))
      .catch(() => {})
  }

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Init motion blur after splash hides
  useEffect(() => {
    if (showSplash) return
    const cleanup = initMotionBlur()
    mbCleanup.current = cleanup
    return cleanup
  }, [showSplash])

  useEffect(() => {
    if (!user) return
    upsertUser({
      telegram_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
    })
      .then(() => setTelegramId(user.id))
      .catch(() => setTelegramId(user.id))

    // Check role: owner from env, staff from employees table
    if (OWNER_IDS.includes(user.id)) {
      setRole('owner')
    } else {
      api.get(`/api/role/${user.id}`)
        .then(({ data }) => setRole(data.role ?? 'user'))
        .catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (isAdmin) refreshPending()
  }, [isAdmin])

  return (
    <AppContext.Provider value={{ telegramId, role, isAdmin, isOwner, pendingCount, refreshPending }}>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div
        className="min-h-screen dark:bg-[#0d0d0d] bg-[#f5f5f5] dark:text-white text-gray-900 transition-colors"
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* page-content is the motion-blur target — BottomNav stays outside so it's never blurred */}
        <div id="page-content" style={{ willChange: 'filter, transform' }}>
          <AnimatedRoutes isAdmin={isAdmin} />
        </div>
        <BottomNav />
      </div>
    </AppContext.Provider>
  )
}

function AnimatedRoutes({ isAdmin }: { isAdmin: boolean }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter" style={{ willChange: 'transform, opacity' }}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/studios" element={<Studios />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" replace />} />
        <Route path="/media" element={<Media />} />
        <Route path="/media/:id" element={<Article />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
