const STORAGE_KEY = 'theme'; // 'light' | 'dark'

export function applyTheme(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme() {
  // Por defecto: claro (ignora el del dispositivo)
  const saved = (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark') || 'light';
  applyTheme(saved);
}

export function toggleTheme() {
  const current = (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark') || 'light';
  applyTheme(current === 'light' ? 'dark' : 'light');
}
