import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'

const _lsStore: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => _lsStore[k] ?? null,
  setItem: (k: string, v: string) => { _lsStore[k] = v },
  removeItem: (k: string) => { delete _lsStore[k] },
  clear: () => { for (const k in _lsStore) delete _lsStore[k] },
})

// Mock Nuxt's useState to return a plain Vue ref
vi.stubGlobal('useState', (_key: string, init: () => boolean) => ref(init()))

// Mock window.matchMedia (not available in happy-dom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
})

import { useDarkMode } from '../app/composables/useDarkMode'

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  describe('init', () => {
    it('defaults to light mode when nothing is stored and system prefers light', () => {
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: false })
      const { isDark, init } = useDarkMode()

      init()

      expect(isDark.value).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('enables dark mode when system prefers dark and no stored preference', () => {
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: true })
      const { isDark, init } = useDarkMode()

      init()

      expect(isDark.value).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('enables dark mode when localStorage is set to "dark"', () => {
      localStorage.setItem('darkMode', 'dark')
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: false })
      const { isDark, init } = useDarkMode()

      init()

      expect(isDark.value).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('stays light when localStorage is set to "light" even if system prefers dark', () => {
      localStorage.setItem('darkMode', 'light')
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: true })
      const { isDark, init } = useDarkMode()

      init()

      expect(isDark.value).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('toggle', () => {
    it('toggles from light to dark', () => {
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: false })
      const { isDark, toggle } = useDarkMode()

      expect(isDark.value).toBe(false)
      toggle()

      expect(isDark.value).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem('darkMode')).toBe('dark')
    })

    it('toggles from dark to light', () => {
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: false })
      const { isDark, init, toggle } = useDarkMode()

      localStorage.setItem('darkMode', 'dark')
      init()
      expect(isDark.value).toBe(true)

      toggle()

      expect(isDark.value).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(localStorage.getItem('darkMode')).toBe('light')
    })

    it('persists preference in localStorage on each toggle', () => {
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: false })
      const { toggle } = useDarkMode()

      toggle()
      expect(localStorage.getItem('darkMode')).toBe('dark')

      toggle()
      expect(localStorage.getItem('darkMode')).toBe('light')
    })
  })

  describe('SSR / server-side rendering guards', () => {
    let originalWindow: typeof globalThis.window

    beforeEach(() => {
      originalWindow = globalThis.window
    })

    afterEach(() => {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      })
    })

    const withoutWindow = (fn: () => void) => {
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      try {
        fn()
      } finally {
        Object.defineProperty(globalThis, 'window', {
          value: originalWindow,
          writable: true,
          configurable: true,
        })
      }
    }

    describe('applyDarkMode SSR guard', () => {
      it('does not add dark class to document when window is undefined (dark=true)', () => {
        document.documentElement.classList.remove('dark')
        const { toggle } = useDarkMode()

        withoutWindow(() => {
          toggle()
        })

        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      it('does not remove dark class from document when window is undefined (dark=false)', () => {
        document.documentElement.classList.add('dark')
        const { isDark, toggle } = useDarkMode()
        // Manually set isDark so next toggle goes dark→light path
        isDark.value = true

        withoutWindow(() => {
          toggle()
        })

        // classList should be unchanged (guard fired before classList.remove)
        expect(document.documentElement.classList.contains('dark')).toBe(true)
        document.documentElement.classList.remove('dark')
      })

      it('does not write to localStorage when window is undefined', () => {
        const { toggle } = useDarkMode()

        withoutWindow(() => {
          toggle()
        })

        expect(localStorage.getItem('darkMode')).toBeNull()
      })

      it('does not throw when window is undefined', () => {
        const { toggle } = useDarkMode()

        expect(() => {
          withoutWindow(() => {
            toggle()
          })
        }).not.toThrow()
      })
    })

    describe('init SSR guard', () => {
      it('does not access localStorage when window is undefined', () => {
        const getItemSpy = vi.spyOn(localStorage, 'getItem')
        const { init } = useDarkMode()

        withoutWindow(() => {
          init()
        })

        expect(getItemSpy).not.toHaveBeenCalled()
      })

      it('does not modify isDark when window is undefined', () => {
        ;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({ matches: true })
        localStorage.setItem('darkMode', 'dark')
        const { isDark, init } = useDarkMode()

        withoutWindow(() => {
          init()
        })

        // isDark should remain at its initial false value
        expect(isDark.value).toBe(false)
      })

      it('does not add dark class to document when window is undefined', () => {
        document.documentElement.classList.remove('dark')
        const { init } = useDarkMode()

        withoutWindow(() => {
          init()
        })

        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      it('does not throw when window is undefined', () => {
        const { init } = useDarkMode()

        expect(() => {
          withoutWindow(() => {
            init()
          })
        }).not.toThrow()
      })
    })
  })
})
