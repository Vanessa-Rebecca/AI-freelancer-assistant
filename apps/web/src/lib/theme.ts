export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export function currentTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Applies the theme and remembers it. Transitions are switched off for one frame
// so every element changes colour at once instead of fading separately.
export function setTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const style = document.createElement('style');
  style.textContent = '*,*::before,*::after{transition:none!important}';
  document.head.append(style);

  root.classList.toggle('dark', mode === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Private mode / blocked storage: the theme still applies for this visit
  }

  // Force a style recalculation before transitions come back
  void window.getComputedStyle(root).opacity;
  requestAnimationFrame(() => style.remove());
}
