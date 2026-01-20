import { describe, it, expect } from 'vitest'
import { sanitizeSensitiveData } from '../sentry.js'

describe('Sentry Data Sanitization', () => {
  describe('sanitizeSensitiveData', () => {
    it('should redact password fields', () => {
      const data = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com'
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.username).toBe('testuser')
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.email).toBe('test@example.com')
    })

    it('should redact authorization headers', () => {
      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer token123',
        'x-api-key': 'secret-key'
      }

      const sanitized = sanitizeSensitiveData(headers)

      expect(sanitized['content-type']).toBe('application/json')
      expect(sanitized['authorization']).toBe('[REDACTED]')
      expect(sanitized['x-api-key']).toBe('[REDACTED]')
    })

    it('should redact nested sensitive fields', () => {
      const data = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            token: 'abc123'
          }
        },
        metadata: {
          source: 'web'
        }
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.user.name).toBe('John')
      expect(sanitized.user.credentials.password).toBe('[REDACTED]')
      expect(sanitized.user.credentials.token).toBe('[REDACTED]')
      expect(sanitized.metadata.source).toBe('web')
    })

    it('should handle arrays with sensitive data', () => {
      const data = {
        users: [
          { username: 'user1', password: 'pass1' },
          { username: 'user2', apiKey: 'key2' }
        ]
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.users[0].username).toBe('user1')
      expect(sanitized.users[0].password).toBe('[REDACTED]')
      expect(sanitized.users[1].username).toBe('user2')
      expect(sanitized.users[1].apiKey).toBe('[REDACTED]')
    })

    it('should redact cookie values', () => {
      const data = {
        cookie: 'session=abc123; token=xyz789',
        session: 'session-id-123',
        sessionid: 'another-session'
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.cookie).toBe('[REDACTED]')
      expect(sanitized.session).toBe('[REDACTED]')
      expect(sanitized.sessionid).toBe('[REDACTED]')
    })

    it('should redact various token types', () => {
      const data = {
        csrf_token: 'csrf123',
        xsrf: 'xsrf456',
        api_token: 'api789',
        refresh_token: 'refresh000'
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.csrf_token).toBe('[REDACTED]')
      expect(sanitized.xsrf).toBe('[REDACTED]')
      expect(sanitized.api_token).toBe('[REDACTED]')
      expect(sanitized.refresh_token).toBe('[REDACTED]')
    })

    it('should handle null and undefined values', () => {
      const data = {
        value1: null,
        value2: undefined,
        value3: 'normal'
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.value1).toBe(null)
      expect(sanitized.value2).toBe(undefined)
      expect(sanitized.value3).toBe('normal')
    })

    it('should prevent infinite recursion with max depth', () => {
      const circular = { level: 1 }
      circular.nested = { level: 2, parent: circular }

      const sanitized = sanitizeSensitiveData(circular)

      expect(sanitized.level).toBe(1)
      expect(sanitized.nested.level).toBe(2)
    })

    it('should handle primitives', () => {
      expect(sanitizeSensitiveData('string')).toBe('string')
      expect(sanitizeSensitiveData(123)).toBe(123)
      expect(sanitizeSensitiveData(true)).toBe(true)
      expect(sanitizeSensitiveData(null)).toBe(null)
    })

    it('should be case-insensitive for sensitive field detection', () => {
      const data = {
        PASSWORD: 'secret1',
        Password: 'secret2',
        pAsSwOrD: 'secret3',
        TOKEN: 'token1',
        ApiKey: 'key1'
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.PASSWORD).toBe('[REDACTED]')
      expect(sanitized.Password).toBe('[REDACTED]')
      expect(sanitized.pAsSwOrD).toBe('[REDACTED]')
      expect(sanitized.TOKEN).toBe('[REDACTED]')
      expect(sanitized.ApiKey).toBe('[REDACTED]')
    })

    it('should redact credit card related fields', () => {
      const data = {
        cardNumber: '4111111111111111',
        ccn: '4111111111111111',
        cvv: '123',
        cvc: '456',
        ssn: '123-45-6789'
      }

      const sanitized = sanitizeSensitiveData(data)

      expect(sanitized.cardNumber).toBe('[REDACTED]')
      expect(sanitized.ccn).toBe('[REDACTED]')
      expect(sanitized.cvv).toBe('[REDACTED]')
      expect(sanitized.cvc).toBe('[REDACTED]')
      expect(sanitized.ssn).toBe('[REDACTED]')
    })
  })
})
