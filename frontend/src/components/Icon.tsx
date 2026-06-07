/** PNG icon sprite component — maps logical names to /icons/*.png */

// CSS filter chains that recolour a white PNG to the target hex
const FILTER_PURPLE = 'brightness(0) invert(65%) sepia(48%) saturate(1053%) hue-rotate(223deg) brightness(103%)'
const FILTER_RED    = 'brightness(0) invert(43%) sepia(94%) saturate(1200%) hue-rotate(328deg) brightness(107%)'

/** Maps logical icon name → filename (without .png extension) in /public/icons/ */
const FILES: Record<string, string> = {
  // ── Service ────────────────────────────────────────────────────────
  microphone:    'service-microphone',
  sliders:       'service-sliders',
  key:           'service-key',
  package:       'service-package',
  // ── UI controls ───────────────────────────────────────────────────
  check:         'check',
  close:         'close',
  'arrow-left':  'arrow-left',
  'arrow-right': 'arrow-right',
  clock:         'clock',
  plus:          'plus',
  minus:         'minus',
  'map-pin':     'map-pin',
  play:          'play',
  pause:         'pause',
  // ── Admin ──────────────────────────────────────────────────────────
  users:         'admin-users',
  'user-add':    'admin-user-add',
  lock:          'admin-lock',
  calendar:      'admin-calendar',
  chart:         'admin-chart',
  block:         'admin-block',
  'admin-plus':  'admin-plus',
  price:         'admin-price',
  send:          'admin-send',
  download:      'admin-download',
  delete:        'admin-delete',
  edit:          'admin-edit',
  trend:         'admin-trend',
  building:      'admin-building',
  // ── Nav ────────────────────────────────────────────────────────────
  'nav-home':    'nav-home',
  'nav-studios': 'nav-studios',
  'nav-booking': 'nav-booking',
  'nav-media':   'nav-media',
  'nav-profile': 'nav-profile',
  'nav-admin':   'nav-admin',
}

type IconColor = 'white' | 'purple' | 'red' | 'dim' | 'very-dim'

interface IconProps {
  name: string
  size?: number
  /** Colour preset — 'white' = no tint, 'purple' = #C17BFF filter, 'red' = #FF4B4B filter,
   *  'dim' = 40% opacity, 'very-dim' = 20% opacity */
  color?: IconColor
  /** Explicit opacity (overrides color preset's opacity) */
  opacity?: number
  style?: React.CSSProperties
  className?: string
}

export function Icon({ name, size = 24, color = 'white', opacity, style, className }: IconProps) {
  const file   = FILES[name] ?? name
  const filter = color === 'purple' ? FILTER_PURPLE : color === 'red' ? FILTER_RED : undefined
  const op     = opacity !== undefined ? opacity
               : color === 'dim'      ? 0.4
               : color === 'very-dim' ? 0.2
               : undefined

  return (
    <img
      src={`/icons/${file}.png`}
      width={size}
      height={size}
      alt=""
      draggable={false}
      style={{ objectFit: 'contain', display: 'inline-block', flexShrink: 0, filter, opacity: op, ...style }}
      className={className}
    />
  )
}
