import { defineStore } from 'pinia'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

interface Admin {
  id: string
  email: string
  name: string
  role: string
}

// Email validation regex - RFC 5322 compliant basic pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Device name constraints
const MAX_DEVICE_NAME_LENGTH = 100
const DEVICE_NAME_SANITIZE_REGEX = /[<>"'`\\]/g

/**
 * Validates email input with comprehensive checks
 * @param email - The email to validate
 * @returns Object with isValid boolean and optional error message
 */
function validateEmail(email: unknown): { isValid: boolean; error?: string; normalized?: string } {
  // Type check - must be a string
  if (typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a string' }
  }

  // Trim whitespace
  const trimmed = email.trim()

  // Empty check after trim
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email is required' }
  }

  // Length check (practical limits)
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long' }
  }

  // Format validation
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  // Normalize to lowercase
  const normalized = trimmed.toLowerCase()

  return { isValid: true, normalized }
}

/**
 * Sanitizes device name input
 * @param deviceName - The device name to sanitize
 * @returns Sanitized device name or undefined
 */
function sanitizeDeviceName(deviceName: unknown): string | undefined {
  // Type check
  if (typeof deviceName !== 'string') {
    return undefined
  }

  // Trim whitespace
  const trimmed = deviceName.trim()

  // Empty check
  if (trimmed.length === 0) {
    return undefined
  }

  // Remove potentially dangerous characters (XSS prevention)
  const sanitized = trimmed.replace(DEVICE_NAME_SANITIZE_REGEX, '')

  // Enforce length limit
  const truncated = sanitized.substring(0, MAX_DEVICE_NAME_LENGTH)

  return truncated.length > 0 ? truncated : undefined
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    admin: null as Admin | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.admin,
    adminName: (state) => state.admin?.name || 'Admin'
  },

  actions: {
    async registerSecurityKey(email: unknown, deviceName?: unknown) {
      // WebAuthn is client-side only, guard against SSR
      if (typeof window === 'undefined') {
        console.warn('registerSecurityKey called on server-side, skipping')
        return false
      }

      // Validate email input BEFORE setting loading state
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        this.error = emailValidation.error || 'Invalid email'
        return false
      }

      const validatedEmail = emailValidation.normalized!
      const sanitizedDeviceName = sanitizeDeviceName(deviceName)

      this.loading = true
      this.error = null

      try {
        const config = useRuntimeConfig()

        console.log('🔐 Starting WebAuthn registration for:', validatedEmail)
        console.log('📍 API Base:', config.public.apiBase)

        // Get registration options from server
        const optionsResponse = await $fetch(`${config.public.apiBase}/api/admin/webauthn/register/options`, {
          method: 'POST',
          body: { email: validatedEmail },
          credentials: 'include'
        }) as any

        console.log('✅ Registration options received:', optionsResponse)

        // Trigger browser WebAuthn registration
        console.log('🔑 Requesting TouchID/Security Key from browser...')
        const credential = await startRegistration({ optionsJSON: optionsResponse })
        console.log('✅ Credential created:', credential)

        // Send credential to server for verification
        console.log('📤 Sending credential to server for verification...')
        const verificationResponse = await $fetch(`${config.public.apiBase}/api/admin/webauthn/register/verify`, {
          method: 'POST',
          credentials: 'include',
          body: {
            email: validatedEmail,
            credential,
            deviceName: sanitizedDeviceName
          }
        })

        console.log('✅ Registration verified:', verificationResponse)
        return verificationResponse.verified
      } catch (err: any) {
        console.error('❌ Registration error:', err)

        // Provide user-friendly error messages
        if (err.name === 'NotAllowedError') {
          this.error = 'Registration was cancelled or timed out. Please try again.'
        } else if (err.name === 'SecurityError') {
          this.error = 'Security error. Make sure you are accessing via http://localhost:3002'
        } else if (err.name === 'InvalidStateError') {
          this.error = 'This security key is already registered for this account.'
        } else if (err.name === 'NotSupportedError') {
          this.error = 'Your browser does not support WebAuthn/TouchID. Try Safari, Chrome, or Edge.'
        } else if (err.message?.includes('fetch') || err.cause?.code === 'ECONNREFUSED') {
          this.error = 'Cannot connect to backend server. Make sure it\'s running on port 3001.'
        } else if (err.statusCode === 404 || err.status === 404) {
          this.error = 'Backend API not found. Make sure backend is running with correct routes.'
        } else {
          // Safely extract error message
          const errorMsg = err.data?.error || err.message || String(err) || 'Registration failed. Check browser console for details.'
          this.error = errorMsg
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async loginWithSecurityKey(email: unknown) {
      // WebAuthn is client-side only, guard against SSR
      if (typeof window === 'undefined') {
        console.warn('loginWithSecurityKey called on server-side, skipping')
        return false
      }

      // Validate email input BEFORE setting loading state
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        this.error = emailValidation.error || 'Invalid email'
        return false
      }

      const validatedEmail = emailValidation.normalized!

      this.loading = true
      this.error = null

      try {
        const config = useRuntimeConfig()

        console.log('🔐 Starting WebAuthn authentication for:', validatedEmail)

        // Get authentication options from server
        const optionsResponse = await $fetch(`${config.public.apiBase}/api/admin/webauthn/authenticate/options`, {
          method: 'POST',
          body: { email: validatedEmail }
        })

        console.log('✅ Authentication options received')

        // Trigger browser WebAuthn authentication
        console.log('🔑 Requesting TouchID/Security Key from browser...')
        const credential = await startAuthentication({ optionsJSON: optionsResponse })
        console.log('✅ Credential received from browser')

        // Send credential to server for verification
        const verificationResponse = await $fetch(`${config.public.apiBase}/api/admin/webauthn/authenticate/verify`, {
          method: 'POST',
          credentials: 'include',
          body: {
            email: validatedEmail,
            credential
          }
        })

        if (verificationResponse.verified && verificationResponse.admin) {
          console.log('✅ Authentication successful')
          this.admin = verificationResponse.admin
          return true
        }
        return false
      } catch (err: any) {
        console.error('❌ Authentication error:', err)

        // Provide user-friendly error messages
        if (err.name === 'NotAllowedError') {
          this.error = 'Authentication was cancelled or timed out. Please try again.'
        } else if (err.name === 'SecurityError') {
          this.error = 'Security error. Make sure you are accessing via http://localhost:3002'
        } else if (err.data?.error === 'No security keys registered. Please register a key first.') {
          this.error = 'No security keys registered. Click "Register Security Key" below to get started.'
        } else if (err.message?.includes('fetch') || err.cause?.code === 'ECONNREFUSED') {
          this.error = 'Cannot connect to backend server. Make sure it\'s running on port 3001.'
        } else if (err.statusCode === 404 || err.status === 404) {
          this.error = 'Backend API not found. Make sure backend is running with correct routes.'
        } else {
          // Safely extract error message
          const errorMsg = err.data?.error || err.message || String(err) || 'Authentication failed. Check browser console for details.'
          this.error = errorMsg
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async checkSession() {
      try {
        const config = useRuntimeConfig()
        const response = await $fetch(`${config.public.apiBase}/api/admin/auth/session`, {
          credentials: 'include'
        })

        if (response.authenticated && response.admin) {
          this.admin = response.admin
          return true
        }
        this.admin = null
        return false
      } catch {
        this.admin = null
        return false
      }
    },

    async logout() {
      try {
        const config = useRuntimeConfig()
        await $fetch(`${config.public.apiBase}/api/admin/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        })
      } catch (err) {
        console.error('Logout error:', err)
      } finally {
        this.admin = null
      }
    }
  }
})
