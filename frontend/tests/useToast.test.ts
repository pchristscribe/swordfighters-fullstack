import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '../app/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    useToast().clear()
    vi.useRealTimers()
  })

  // ─── Creation ─────────────────────────────────────────────────────────────

  describe('toast creation', () => {
    it('success() adds a toast with type success', () => {
      const { success, toasts } = useToast()
      success('Saved!')
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('success')
      expect(toasts.value[0].message).toBe('Saved!')
    })

    it('error() adds a toast with type error', () => {
      const { error, toasts } = useToast()
      error('Something went wrong')
      expect(toasts.value[0].type).toBe('error')
    })

    it('warning() adds a toast with type warning', () => {
      const { warning, toasts } = useToast()
      warning('Low stock')
      expect(toasts.value[0].type).toBe('warning')
    })

    it('info() adds a toast with type info', () => {
      const { info, toasts } = useToast()
      info('Free shipping over $50')
      expect(toasts.value[0].type).toBe('info')
    })

    it('returns a unique string id for each toast', () => {
      const { success, error } = useToast()
      const id1 = success('First')
      const id2 = error('Second')
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      expect(id1).not.toBe(id2)
    })

    it('multiple toasts stack in order', () => {
      const { success, error, warning, toasts } = useToast()
      success('A')
      error('B')
      warning('C')
      expect(toasts.value).toHaveLength(3)
      expect(toasts.value.map(t => t.message)).toEqual(['A', 'B', 'C'])
    })

    it('passes action through to the toast', () => {
      const onClick = vi.fn()
      const { info, toasts } = useToast()
      info('Click me', { action: { label: 'Undo', onClick } })
      expect(toasts.value[0].action?.label).toBe('Undo')
      expect(toasts.value[0].action?.onClick).toBe(onClick)
    })
  })

  // ─── Default durations ────────────────────────────────────────────────────

  describe('default durations', () => {
    it('success default duration is 4000ms', () => {
      const { success, toasts } = useToast()
      success('OK')
      expect(toasts.value[0].duration).toBe(4000)
    })

    it('error default duration is 6000ms', () => {
      const { error, toasts } = useToast()
      error('Fail')
      expect(toasts.value[0].duration).toBe(6000)
    })

    it('warning default duration is 5000ms', () => {
      const { warning, toasts } = useToast()
      warning('Watch out')
      expect(toasts.value[0].duration).toBe(5000)
    })

    it('info default duration is 4000ms', () => {
      const { info, toasts } = useToast()
      info('FYI')
      expect(toasts.value[0].duration).toBe(4000)
    })

    it('custom duration overrides the default', () => {
      const { success, toasts } = useToast()
      success('OK', { duration: 10000 })
      expect(toasts.value[0].duration).toBe(10000)
    })
  })

  // ─── Dismiss ──────────────────────────────────────────────────────────────

  describe('dismiss', () => {
    it('removes the toast with the matching id', () => {
      const { success, dismiss, toasts } = useToast()
      const id = success('Hello')
      expect(toasts.value).toHaveLength(1)
      dismiss(id)
      expect(toasts.value).toHaveLength(0)
    })

    it('only removes the matching toast when multiple are present', () => {
      const { success, error, dismiss, toasts } = useToast()
      success('A')
      const id = error('B')
      success('C')
      dismiss(id)
      expect(toasts.value).toHaveLength(2)
      expect(toasts.value.map(t => t.message)).toEqual(['A', 'C'])
    })

    it('does not throw when dismissing a non-existent id', () => {
      const { dismiss, toasts } = useToast()
      expect(() => dismiss('ghost-id')).not.toThrow()
      expect(toasts.value).toHaveLength(0)
    })
  })

  // ─── Clear ────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all toasts at once', () => {
      const { success, error, warning, clear, toasts } = useToast()
      success('A')
      error('B')
      warning('C')
      clear()
      expect(toasts.value).toHaveLength(0)
    })

    it('is a no-op when the list is already empty', () => {
      const { clear, toasts } = useToast()
      expect(() => clear()).not.toThrow()
      expect(toasts.value).toHaveLength(0)
    })
  })

  // ─── Auto-dismiss ─────────────────────────────────────────────────────────

  describe('auto-dismiss', () => {
    it('removes a toast automatically after its duration', () => {
      vi.useFakeTimers()
      const { success, toasts } = useToast()
      success('Bye soon', { duration: 2000 })
      expect(toasts.value).toHaveLength(1)
      vi.advanceTimersByTime(2000)
      expect(toasts.value).toHaveLength(0)
    })

    it('does not remove before duration elapses', () => {
      vi.useFakeTimers()
      const { success, toasts } = useToast()
      success('Still here', { duration: 3000 })
      vi.advanceTimersByTime(2999)
      expect(toasts.value).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(toasts.value).toHaveLength(0)
    })

    it('persistent toast (duration 0) is never auto-dismissed', () => {
      vi.useFakeTimers()
      const { error, toasts } = useToast()
      error('This stays', { duration: 0 })
      vi.advanceTimersByTime(60_000)
      expect(toasts.value).toHaveLength(1)
    })

    it('can still manually dismiss a persistent toast', () => {
      vi.useFakeTimers()
      const { error, dismiss, toasts } = useToast()
      const id = error('Sticky', { duration: 0 })
      vi.advanceTimersByTime(60_000)
      expect(toasts.value).toHaveLength(1)
      dismiss(id)
      expect(toasts.value).toHaveLength(0)
    })
  })
})
