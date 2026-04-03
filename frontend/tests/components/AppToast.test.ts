import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppToast from '../../app/components/feedback/AppToast.vue'
import type { Toast } from '../../app/composables/useToast'

const makeToast = (overrides: Partial<Toast> = {}): Toast => ({
  id: 'toast-1',
  type: 'info',
  message: 'Test notification',
  duration: 4000,
  ...overrides,
})

describe('AppToast', () => {
  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('displays the toast message', () => {
      const wrapper = mount(AppToast, { props: { toast: makeToast({ message: 'Item added!' }) } })
      expect(wrapper.text()).toContain('Item added!')
    })

    it('renders a dismiss button', () => {
      const wrapper = mount(AppToast, { props: { toast: makeToast() } })
      const btn = wrapper.find('[aria-label^="Dismiss"]')
      expect(btn.exists()).toBe(true)
    })

    it('does not render an action button when action is not provided', () => {
      const wrapper = mount(AppToast, { props: { toast: makeToast() } })
      // Only the dismiss button should be present
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(1)
    })

    it('renders an action button when action is provided', () => {
      const toast = makeToast({ action: { label: 'Undo', onClick: vi.fn() } })
      const wrapper = mount(AppToast, { props: { toast } })
      expect(wrapper.text()).toContain('Undo')
    })

    it('has role="alert"', () => {
      const wrapper = mount(AppToast, { props: { toast: makeToast() } })
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })
  })

  // ─── ARIA live regions ────────────────────────────────────────────────────

  describe('aria-live regions', () => {
    it('uses aria-live="assertive" for error type', () => {
      const wrapper = mount(AppToast, { props: { toast: makeToast({ type: 'error' }) } })
      expect(wrapper.find('[role="alert"]').attributes('aria-live')).toBe('assertive')
    })

    it.each(['success', 'warning', 'info'] as const)(
      'uses aria-live="polite" for %s type',
      (type) => {
        const wrapper = mount(AppToast, { props: { toast: makeToast({ type }) } })
        expect(wrapper.find('[role="alert"]').attributes('aria-live')).toBe('polite')
      }
    )
  })

  // ─── Variant styling ──────────────────────────────────────────────────────

  describe('variant styling', () => {
    it.each(['success', 'error', 'warning', 'info'] as const)(
      'applies the correct container class for type "%s"',
      (type) => {
        const wrapper = mount(AppToast, { props: { toast: makeToast({ type }) } })
        const container = wrapper.find('[role="alert"]')
        // Each type has a distinct border-l-4 class and background token
        expect(container.classes()).toContain('border-l-4')
      }
    )

    it('applies brand-muted background for error type', () => {
      const wrapper = mount(AppToast, { props: { toast: makeToast({ type: 'error' }) } })
      expect(wrapper.find('[role="alert"]').classes()).toContain('bg-brand-muted')
    })

    it('applies accent-muted background for warning type', () => {
      const wrapper = mount(AppToast, { props: { toast: makeToast({ type: 'warning' }) } })
      expect(wrapper.find('[role="alert"]').classes()).toContain('bg-accent-muted')
    })
  })

  // ─── Interactions ─────────────────────────────────────────────────────────

  describe('interactions', () => {
    it('emits dismiss with the toast id when dismiss button is clicked', async () => {
      const toast = makeToast({ id: 'toast-abc' })
      const wrapper = mount(AppToast, { props: { toast } })
      await wrapper.find('[aria-label^="Dismiss"]').trigger('click')
      expect(wrapper.emitted('dismiss')).toBeTruthy()
      expect(wrapper.emitted('dismiss')?.[0]).toEqual(['toast-abc'])
    })

    it('calls action onClick and emits dismiss when action button is clicked', async () => {
      const onClick = vi.fn()
      const toast = makeToast({ id: 'toast-xyz', action: { label: 'Retry', onClick } })
      const wrapper = mount(AppToast, { props: { toast } })
      // The action button is the first button (dismiss is the icon button after)
      const buttons = wrapper.findAll('button')
      const actionBtn = buttons.find(b => b.text() === 'Retry')
      await actionBtn?.trigger('click')
      expect(onClick).toHaveBeenCalledOnce()
      expect(wrapper.emitted('dismiss')?.[0]).toEqual(['toast-xyz'])
    })
  })
})
