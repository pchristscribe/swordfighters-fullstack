import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppAlert from '../../app/components/feedback/AppAlert.vue'

describe('AppAlert', () => {
  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders default slot content', () => {
      const wrapper = mount(AppAlert, { slots: { default: 'Something went wrong.' } })
      expect(wrapper.text()).toContain('Something went wrong.')
    })

    it('renders title when provided', () => {
      const wrapper = mount(AppAlert, {
        props: { title: 'Payment failed' },
        slots: { default: 'Try again.' },
      })
      expect(wrapper.text()).toContain('Payment failed')
    })

    it('does not render title element when title is not provided', () => {
      const wrapper = mount(AppAlert, { slots: { default: 'msg' } })
      expect(wrapper.find('p').exists()).toBe(false)
    })

    it('renders action slot when provided', () => {
      const wrapper = mount(AppAlert, {
        slots: {
          default: 'Check this',
          action: '<a href="/billing">Update billing</a>',
        },
      })
      expect(wrapper.text()).toContain('Update billing')
    })

    it('has role="alert"', () => {
      const wrapper = mount(AppAlert, { slots: { default: 'x' } })
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })
  })

  // ─── Dismiss ──────────────────────────────────────────────────────────────

  describe('dismissible', () => {
    it('does not show a dismiss button when dismissible is false (default)', () => {
      const wrapper = mount(AppAlert, { slots: { default: 'x' } })
      expect(wrapper.find('button[aria-label="Dismiss"]').exists()).toBe(false)
    })

    it('shows a dismiss button when dismissible is true', () => {
      const wrapper = mount(AppAlert, {
        props: { dismissible: true },
        slots: { default: 'x' },
      })
      expect(wrapper.find('button[aria-label="Dismiss"]').exists()).toBe(true)
    })

    it('hides the component when the dismiss button is clicked', async () => {
      const wrapper = mount(AppAlert, {
        props: { dismissible: true },
        slots: { default: 'x' },
      })
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      await wrapper.find('button[aria-label="Dismiss"]').trigger('click')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('emits the dismiss event when the button is clicked', async () => {
      const wrapper = mount(AppAlert, {
        props: { dismissible: true },
        slots: { default: 'x' },
      })
      await wrapper.find('button[aria-label="Dismiss"]').trigger('click')
      expect(wrapper.emitted('dismiss')).toBeTruthy()
    })
  })

  // ─── ARIA live regions ────────────────────────────────────────────────────

  describe('aria-live regions', () => {
    it('uses aria-live="assertive" for error type', () => {
      const wrapper = mount(AppAlert, {
        props: { type: 'error' },
        slots: { default: 'x' },
      })
      expect(wrapper.find('[role="alert"]').attributes('aria-live')).toBe('assertive')
    })

    it.each(['success', 'warning', 'info'] as const)(
      'uses aria-live="polite" for %s type',
      (type) => {
        const wrapper = mount(AppAlert, { props: { type }, slots: { default: 'x' } })
        expect(wrapper.find('[role="alert"]').attributes('aria-live')).toBe('polite')
      }
    )
  })

  // ─── Variant styling ──────────────────────────────────────────────────────

  describe('variant styling', () => {
    it('applies brand-muted background for error type', () => {
      const wrapper = mount(AppAlert, { props: { type: 'error' }, slots: { default: 'x' } })
      expect(wrapper.find('[role="alert"]').classes()).toContain('bg-brand-muted')
    })

    it('applies accent-muted background for warning type', () => {
      const wrapper = mount(AppAlert, { props: { type: 'warning' }, slots: { default: 'x' } })
      expect(wrapper.find('[role="alert"]').classes()).toContain('bg-accent-muted')
    })

    it('applies rounded-input border radius', () => {
      const wrapper = mount(AppAlert, { slots: { default: 'x' } })
      expect(wrapper.find('[role="alert"]').classes()).toContain('rounded-input')
    })

    it('defaults to info type when no type is provided', () => {
      const wrapper = mount(AppAlert, { slots: { default: 'x' } })
      // info type uses bg-blue-50 (not brand-muted or accent-muted)
      const classes = wrapper.find('[role="alert"]').classes()
      expect(classes).not.toContain('bg-brand-muted')
      expect(classes).not.toContain('bg-accent-muted')
    })
  })
})
