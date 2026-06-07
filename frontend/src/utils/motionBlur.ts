/**
 * Scroll Motion Effect — lightweight opacity + direction shift.
 *
 * Instead of expensive SVG blur filters, uses only opacity and a tiny
 * translateY to create a sense of speed without any visual slowdown.
 * Opacity is the cheapest GPU compositing operation available.
 */

const SETTLE_MS    = 40    // ms after last scroll to start recovery
const VELOCITY_CAP = 4     // px/ms → max effect
const MIN_OPACITY  = 0.82  // opacity at peak velocity
const MAX_SHIFT    = 3     // px translateY at peak velocity

let contentEl:   HTMLElement | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
let prevY = 0
let prevT = 0
let direction = 0

function getEl() {
  if (!contentEl) contentEl = document.getElementById('page-content')
  return contentEl
}

function applyEffect(velocity: number) {
  const el = getEl()
  if (!el) return

  const t = Math.min(velocity / VELOCITY_CAP, 1)  // 0..1

  el.style.transition = 'none'
  el.style.opacity    = `${(1 - t * (1 - MIN_OPACITY)).toFixed(3)}`
  el.style.transform  = `translateY(${(direction * t * MAX_SHIFT).toFixed(2)}px)`
}

function clearEffect() {
  const el = getEl()
  if (!el) return
  el.style.transition = 'opacity 0.18s ease, transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)'
  el.style.opacity    = '1'
  el.style.transform  = ''
}

function onScroll() {
  const now = performance.now()
  const dy  = window.scrollY - prevY
  const dt  = Math.max(now - prevT, 1)

  direction = dy > 0 ? 1 : -1
  prevY = window.scrollY
  prevT = now

  const velocity = Math.abs(dy) / dt
  applyEffect(velocity)

  if (settleTimer) clearTimeout(settleTimer)
  settleTimer = setTimeout(clearEffect, SETTLE_MS)
}

export function initMotionBlur(): () => void {
  prevY = window.scrollY
  prevT = performance.now()
  window.addEventListener('scroll', onScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', onScroll)
    if (settleTimer) clearTimeout(settleTimer)
    clearEffect()
  }
}
