/**
 * Motion Blur — velocity-based directional blur during scroll.
 *
 * Uses an SVG feGaussianBlur filter (vertical only) whose stdDeviation
 * is updated in real-time proportional to scroll speed.
 * On scroll stop: exponential decay back to 0 via requestAnimationFrame.
 */

const MAX_BLUR     = 14    // max stdDeviation at peak velocity
const VELOCITY_CAP = 6     // px/ms → maps to MAX_BLUR
const SETTLE_MS    = 45    // wait after last scroll event before decaying
const DECAY_K      = 0.72  // fraction remaining each frame (~60fps decay)
const MIN_BLUR     = 0.08  // below this → snap to 0

let svgFilter:   SVGFEGaussianBlurElement | null = null
let contentEl:   HTMLElement | null = null
let currentBlur  = 0
let decayRaf:    number | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
let prevY        = 0
let prevT        = 0
let direction    = 0  // +1 down, -1 up

/* ── DOM helpers ─────────────────────────────────────────────────────── */

function resolveEls() {
  if (!svgFilter) {
    svgFilter = document.querySelector('#mb-y feGaussianBlur') as SVGFEGaussianBlurElement | null
  }
  if (!contentEl) {
    contentEl = document.getElementById('page-content')
  }
}

function setBlur(v: number) {
  resolveEls()
  currentBlur = v

  if (!svgFilter || !contentEl) return

  if (v > MIN_BLUR) {
    svgFilter.setAttribute('stdDeviation', `0 ${v.toFixed(3)}`)
    contentEl.style.filter = 'url(#mb-y)'
    // Subtle directional shift for extra realism
    contentEl.style.transform = `translateY(${direction * v * 0.18}px)`
  } else {
    svgFilter.setAttribute('stdDeviation', '0 0')
    contentEl.style.filter = ''
    contentEl.style.transform = ''
    currentBlur = 0
  }
}

/* ── RAF decay loop ──────────────────────────────────────────────────── */

function startDecay() {
  if (decayRaf) cancelAnimationFrame(decayRaf)

  const step = () => {
    currentBlur *= DECAY_K
    if (currentBlur < MIN_BLUR) {
      setBlur(0)
      decayRaf = null
    } else {
      setBlur(currentBlur)
      decayRaf = requestAnimationFrame(step)
    }
  }

  decayRaf = requestAnimationFrame(step)
}

/* ── Scroll handler ──────────────────────────────────────────────────── */

function onScroll() {
  const now = performance.now()
  const dy  = window.scrollY - prevY
  const dt  = Math.max(now - prevT, 1)

  direction = dy > 0 ? 1 : -1
  prevY = window.scrollY
  prevT = now

  const velocity = Math.abs(dy) / dt                        // px/ms
  const target   = Math.min((velocity / VELOCITY_CAP) * MAX_BLUR, MAX_BLUR)

  // Increase immediately, don't wait
  if (target > currentBlur) {
    if (decayRaf) { cancelAnimationFrame(decayRaf); decayRaf = null }
    setBlur(target)
  }

  // Reset settle timer — decay starts once scroll stops
  if (settleTimer) clearTimeout(settleTimer)
  settleTimer = setTimeout(startDecay, SETTLE_MS)
}

/* ── Public API ──────────────────────────────────────────────────────── */

export function initMotionBlur(): () => void {
  prevY = window.scrollY
  prevT = performance.now()
  window.addEventListener('scroll', onScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', onScroll)
    if (settleTimer) clearTimeout(settleTimer)
    if (decayRaf)    cancelAnimationFrame(decayRaf)
    setBlur(0)
  }
}
