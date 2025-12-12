import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const THEME_KEY = 'theme' // 'light' | 'dark'
export const ACCENT_KEY = 'midespensa_accent_color'
export const DEFAULT_ACCENT = '#2ea15d'

let didInit = false

export const accentColor = ref<string>(DEFAULT_ACCENT)

function isValidHex(hex: string) {
  return /^#[0-9A-Fa-f]{6}$/.test((hex ?? '').trim())
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = (hex ?? '').trim()
  if (!isValidHex(h)) return null
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return { r, g, b }
}

export function applyTheme(theme: Theme) {
  const isDark = theme === 'dark'
  document.body.classList.toggle('dark', isDark)
  localStorage.setItem(THEME_KEY, theme)
}

export function initTheme() {
  if (didInit) return
  didInit = true

  const savedTheme = (localStorage.getItem(THEME_KEY) as Theme) || 'light'
  applyTheme(savedTheme)

  initAccentColor()

  // Sync entre pestañas
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue)
      return
    }
    if (e.key === ACCENT_KEY && typeof e.newValue === 'string' && isValidHex(e.newValue)) {
      accentColor.value = e.newValue
    }
  })
}

export function toggleTheme() {
  const current = (localStorage.getItem(THEME_KEY) as Theme) || 'light'
  applyTheme(current === 'light' ? 'dark' : 'light')
}

export function applyAccentColor(hex: string) {
  const safeHex = isValidHex(hex) ? hex : DEFAULT_ACCENT
  const rgb = hexToRgb(safeHex) ?? hexToRgb(DEFAULT_ACCENT)!

  // Vars propias (tu app)
  document.documentElement.style.setProperty('--md-accent', safeHex)
  document.documentElement.style.setProperty('--md-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
}

export function initAccentColor() {
  const saved = localStorage.getItem(ACCENT_KEY)
  accentColor.value = saved && isValidHex(saved) ? saved : DEFAULT_ACCENT
  applyAccentColor(accentColor.value)
}

// “Lógica tipo codes”: el ref manda, y el watch aplica/persiste
watch(
  accentColor,
  (val) => {
    const safe = isValidHex(val) ? val : DEFAULT_ACCENT
    localStorage.setItem(ACCENT_KEY, safe)
    applyAccentColor(safe)
  },
  { flush: 'sync' }
)

export function setAccentColor(hex: string) {
  if (!isValidHex(hex)) return
  accentColor.value = hex
}

export function resetAccentColor() {
  accentColor.value = DEFAULT_ACCENT
}
