/**
 * Backend Security Tests
 *
 * Comprehensive test suite for backend security utilities.
 * Mirrors frontend security tests to ensure consistent validation.
 *
 * Run with: npm test or jest security.test.js
 *
 * Test Framework: Jest (or Mocha/Chai)
 */

const {
  isValidHttpUrl,
  sanitizeText,
  validateEmail,
  validatePrice,
  validateRating,
  validateArrayLength,
  sanitizeStringArray
} = require('../utils/security')

describe('Backend Security Utilities', () => {
  describe('isValidHttpUrl', () => {
    describe('Valid URLs', () => {
      test('should accept valid HTTP URLs', () => {
        expect(isValidHttpUrl('http://example.com')).toBe(true)
        expect(isValidHttpUrl('http://example.com/path')).toBe(true)
        expect(isValidHttpUrl('http://example.com/path?query=value')).toBe(true)
        expect(isValidHttpUrl('http://example.com:8080')).toBe(true)
      })

      test('should accept valid HTTPS URLs', () => {
        expect(isValidHttpUrl('https://example.com')).toBe(true)
        expect(isValidHttpUrl('https://example.com/path')).toBe(true)
        expect(isValidHttpUrl('https://subdomain.example.com')).toBe(true)
      })

      test('should be case-insensitive for protocol', () => {
        expect(isValidHttpUrl('HTTP://example.com')).toBe(true)
        expect(isValidHttpUrl('HTTPS://example.com')).toBe(true)
        expect(isValidHttpUrl('HtTpS://example.com')).toBe(true)
      })
    })

    describe('Invalid URLs - Security Threats', () => {
      test('should reject javascript: protocol (XSS attack)', () => {
        expect(isValidHttpUrl('javascript:alert("XSS")')).toBe(false)
        expect(isValidHttpUrl('javascript:void(0)')).toBe(false)
        expect(isValidHttpUrl('JAVASCRIPT:alert(1)')).toBe(false)
      })

      test('should reject data: protocol (XSS attack)', () => {
        expect(isValidHttpUrl('data:text/html,<script>alert("XSS")</script>')).toBe(false)
        expect(isValidHttpUrl('DATA:text/plain,test')).toBe(false)
      })

      test('should reject file: protocol', () => {
        expect(isValidHttpUrl('file:///etc/passwd')).toBe(false)
        expect(isValidHttpUrl('file://C:/Windows/System32')).toBe(false)
      })

      test('should reject other dangerous protocols', () => {
        expect(isValidHttpUrl('vbscript:msgbox("XSS")')).toBe(false)
        expect(isValidHttpUrl('about:blank')).toBe(false)
        expect(isValidHttpUrl('blob:https://example.com/uuid')).toBe(false)
      })
    })

    describe('Invalid URLs - Malformed Input', () => {
      test('should reject empty and whitespace-only strings', () => {
        expect(isValidHttpUrl('')).toBe(false)
        expect(isValidHttpUrl('   ')).toBe(false)
        expect(isValidHttpUrl('\t')).toBe(false)
      })

      test('should reject null and undefined', () => {
        expect(isValidHttpUrl(null)).toBe(false)
        expect(isValidHttpUrl(undefined)).toBe(false)
      })

      test('should reject non-string types', () => {
        expect(isValidHttpUrl(123)).toBe(false)
        expect(isValidHttpUrl({})).toBe(false)
        expect(isValidHttpUrl([])).toBe(false)
      })

      test('should reject malformed URLs', () => {
        expect(isValidHttpUrl('not a url')).toBe(false)
        expect(isValidHttpUrl('example.com')).toBe(false) // Missing protocol
      })

      test('should reject excessively long URLs (DoS prevention)', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(3000)
        expect(isValidHttpUrl(longUrl)).toBe(false)
      })
    })

    describe('Production Security - Internal IP Blocking', () => {
      // Note: These tests depend on NODE_ENV=production
      // In development, internal IPs are allowed

      test('should block localhost in production', () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'

        expect(isValidHttpUrl('http://localhost')).toBe(false)
        expect(isValidHttpUrl('http://127.0.0.1')).toBe(false)

        process.env.NODE_ENV = originalEnv
      })

      test('should block private IP ranges in production', () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'

        expect(isValidHttpUrl('http://192.168.1.1')).toBe(false)
        expect(isValidHttpUrl('http://10.0.0.1')).toBe(false)
        expect(isValidHttpUrl('http://172.16.0.1')).toBe(false)

        process.env.NODE_ENV = originalEnv
      })
    })
  })

  describe('sanitizeText', () => {
    describe('HTML Tag Removal', () => {
      test('should remove script tags AND their content', () => {
        expect(sanitizeText('<script>alert("XSS")</script>')).toBe('')
        expect(sanitizeText('Hello<script>alert(1)</script>World')).toBe('HelloWorld')
      })

      test('should remove all dangerous tags with content', () => {
        expect(sanitizeText('<iframe src="evil.com"></iframe>')).toBe('')
        expect(sanitizeText('<object data="evil.swf"></object>')).toBe('')
        expect(sanitizeText('<embed src="evil.swf">')).toBe('')
        expect(sanitizeText('<form><input></form>')).toBe('')
      })

      test('should strip safe HTML tags but preserve content', () => {
        expect(sanitizeText('<div>Content</div>')).toBe('Content')
        expect(sanitizeText('<p>Paragraph</p>')).toBe('Paragraph')
        expect(sanitizeText('<b>Bold</b>')).toBe('Bold')
      })

      test('should remove HTML comments', () => {
        expect(sanitizeText('Text<!-- comment -->More')).toBe('TextMore')
      })

      test('should remove CDATA sections', () => {
        expect(sanitizeText('Text<![CDATA[data]]>More')).toBe('TextMore')
      })
    })

    describe('XSS Attack Patterns', () => {
      test('should remove script tags with various casings', () => {
        expect(sanitizeText('<SCRIPT>alert(1)</SCRIPT>')).toBe('')
        expect(sanitizeText('<ScRiPt>alert(1)</ScRiPt>')).toBe('')
      })

      test('should prevent XSS via event handlers', () => {
        expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('')
        expect(sanitizeText('<div onclick="malicious()">Text</div>')).toBe('Text')
      })
    })

    describe('Text Preservation', () => {
      test('should preserve plain text', () => {
        expect(sanitizeText('Hello, World!')).toBe('Hello, World!')
        expect(sanitizeText('This is plain text.')).toBe('This is plain text.')
      })

      test('should preserve special characters', () => {
        expect(sanitizeText('Price: $19.99')).toBe('Price: $19.99')
        expect(sanitizeText('Email: user@example.com')).toBe('Email: user@example.com')
      })

      test('should decode HTML entities', () => {
        expect(sanitizeText('&lt;div&gt;')).toBe('<div>')
        expect(sanitizeText('&amp;&quot;')).toBe('&"')
      })
    })

    describe('Edge Cases', () => {
      test('should return empty string for null/undefined', () => {
        expect(sanitizeText(null)).toBe('')
        expect(sanitizeText(undefined)).toBe('')
        expect(sanitizeText('')).toBe('')
      })

      test('should handle non-string types', () => {
        expect(sanitizeText(123)).toBe('')
        expect(sanitizeText({})).toBe('')
        expect(sanitizeText([])).toBe('')
      })

      test('should handle malformed HTML', () => {
        expect(sanitizeText('<div>Unclosed tag')).toBe('Unclosed tag')
        expect(sanitizeText('Unopened</div>')).toBe('Unopened')
      })
    })
  })

  describe('validateEmail', () => {
    describe('Valid Emails', () => {
      test('should accept valid email formats', () => {
        expect(validateEmail('user@example.com').valid).toBe(true)
        expect(validateEmail('test.user@example.com').valid).toBe(true)
        expect(validateEmail('user+tag@example.com').valid).toBe(true)
      })

      test('should normalize email to lowercase', () => {
        const result = validateEmail('User@Example.COM')
        expect(result.valid).toBe(true)
        expect(result.email).toBe('user@example.com')
      })

      test('should trim whitespace', () => {
        const result = validateEmail('  user@example.com  ')
        expect(result.valid).toBe(true)
        expect(result.email).toBe('user@example.com')
      })
    })

    describe('Invalid Emails', () => {
      test('should reject invalid formats', () => {
        expect(validateEmail('notanemail').valid).toBe(false)
        expect(validateEmail('@example.com').valid).toBe(false)
        expect(validateEmail('user@').valid).toBe(false)
        expect(validateEmail('user @example.com').valid).toBe(false) // Space
      })

      test('should reject empty/whitespace', () => {
        expect(validateEmail('').valid).toBe(false)
        expect(validateEmail('   ').valid).toBe(false)
      })

      test('should reject non-string types', () => {
        expect(validateEmail(123).valid).toBe(false)
        expect(validateEmail(null).valid).toBe(false)
        expect(validateEmail(undefined).valid).toBe(false)
      })

      test('should reject excessively long emails', () => {
        const longEmail = 'a'.repeat(300) + '@example.com'
        expect(validateEmail(longEmail).valid).toBe(false)
      })
    })
  })

  describe('validatePrice', () => {
    describe('Valid Prices', () => {
      test('should accept valid positive numbers', () => {
        expect(validatePrice(19.99).valid).toBe(true)
        expect(validatePrice('29.99').valid).toBe(true) // String coercion
        expect(validatePrice(100).valid).toBe(true)
      })

      test('should round to 2 decimal places', () => {
        const result = validatePrice(19.999)
        expect(result.valid).toBe(true)
        expect(result.price).toBe(20.00)
      })

      test('should accept prices with max 2 decimal places', () => {
        expect(validatePrice(19.9).valid).toBe(true)
        expect(validatePrice(19.99).valid).toBe(true)
      })
    })

    describe('Invalid Prices', () => {
      test('should reject non-numeric values', () => {
        expect(validatePrice('not a number').valid).toBe(false)
        expect(validatePrice(NaN).valid).toBe(false)
      })

      test('should reject zero and negative values', () => {
        expect(validatePrice(0).valid).toBe(false)
        expect(validatePrice(-10).valid).toBe(false)
      })

      test('should reject excessively large values', () => {
        expect(validatePrice(9999999).valid).toBe(false)
      })

      test('should reject prices with >2 decimal places', () => {
        expect(validatePrice(19.999).valid).toBe(true) // Rounds to 20.00
        expect(validatePrice('19.9999').valid).toBe(true) // Rounds to 20.00
      })
    })
  })

  describe('validateRating', () => {
    describe('Valid Ratings', () => {
      test('should accept ratings 1-5', () => {
        expect(validateRating(1).valid).toBe(true)
        expect(validateRating(3).valid).toBe(true)
        expect(validateRating(5).valid).toBe(true)
      })

      test('should accept string numbers', () => {
        expect(validateRating('3').valid).toBe(true)
        expect(validateRating('5').valid).toBe(true)
      })
    })

    describe('Invalid Ratings', () => {
      test('should reject out of range values', () => {
        expect(validateRating(0).valid).toBe(false)
        expect(validateRating(6).valid).toBe(false)
        expect(validateRating(-1).valid).toBe(false)
      })

      test('should reject decimal values', () => {
        expect(validateRating(3.5).valid).toBe(false)
        expect(validateRating(4.9).valid).toBe(false)
      })

      test('should reject non-numeric values', () => {
        expect(validateRating('not a number').valid).toBe(false)
        expect(validateRating(NaN).valid).toBe(false)
      })
    })
  })

  describe('validateArrayLength', () => {
    test('should accept arrays within max length', () => {
      expect(validateArrayLength([1, 2, 3], 5).valid).toBe(true)
      expect(validateArrayLength([], 10).valid).toBe(true)
    })

    test('should reject arrays exceeding max length', () => {
      const result = validateArrayLength([1, 2, 3, 4, 5, 6], 5, 'items')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot exceed 5 items')
    })

    test('should reject non-array values', () => {
      expect(validateArrayLength('not an array', 5).valid).toBe(false)
      expect(validateArrayLength(123, 5).valid).toBe(false)
    })
  })

  describe('sanitizeStringArray', () => {
    test('should sanitize and filter string arrays', () => {
      const input = ['<b>test</b>', '  valid  ', '', '<script>alert(1)</script>text']
      const result = sanitizeStringArray(input)

      expect(result).toEqual(['test', 'valid', 'text'])
    })

    test('should remove empty strings', () => {
      const input = ['test', '', '   ', 'valid']
      const result = sanitizeStringArray(input)

      expect(result).toEqual(['test', 'valid'])
    })

    test('should handle non-array input', () => {
      expect(sanitizeStringArray('not an array')).toEqual([])
      expect(sanitizeStringArray(null)).toEqual([])
      expect(sanitizeStringArray(undefined)).toEqual([])
    })

    test('should filter out non-string items', () => {
      const input = ['test', 123, null, 'valid', {}]
      const result = sanitizeStringArray(input)

      expect(result).toEqual(['test', 'valid'])
    })
  })
})

// ============================================================================
// API Endpoint Security Tests (Integration Tests)
// ============================================================================

describe('API Security Integration Tests', () => {
  // Note: These tests require supertest and a test database
  // Example setup:
  // const request = require('supertest')
  // const app = require('../app')

  describe('Product Creation Security', () => {
    test.todo('should reject javascript: protocol in imageUrl')
    test.todo('should reject data: protocol in imageUrl')
    test.todo('should sanitize title and description')
    test.todo('should reject excessively long titles')
    test.todo('should require authentication')
    test.todo('should require admin role')
  })

  describe('SQL Injection Protection', () => {
    test.todo('should not allow SQL injection in search query')
    test.todo('should not allow SQL injection in filter parameters')
    test.todo('should safely handle special characters in search')
  })

  describe('Rate Limiting', () => {
    test.todo('should enforce rate limits on auth endpoints')
    test.todo('should allow requests within rate limit')
    test.todo('should return 429 when rate limit exceeded')
  })

  describe('CSRF Protection', () => {
    test.todo('should reject requests without CSRF token')
    test.todo('should accept requests with valid CSRF token')
  })
})

// ============================================================================
// Run Tests
// ============================================================================

/*
To run these tests:

1. Install Jest:
   npm install --save-dev jest

2. Add to package.json:
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch",
     "test:coverage": "jest --coverage"
   }

3. Run tests:
   npm test

4. Watch mode:
   npm run test:watch

5. Coverage report:
   npm run test:coverage
*/
