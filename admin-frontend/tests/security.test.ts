import { describe, it, expect } from 'vitest'
import { isValidHttpUrl, getSafeImageUrl, sanitizeText } from '~/utils/security'

describe('Security Utilities', () => {
  describe('isValidHttpUrl', () => {
    describe('Valid URLs', () => {
      it('should accept valid HTTP URLs', () => {
        expect(isValidHttpUrl('http://example.com')).toBe(true)
        expect(isValidHttpUrl('http://example.com/path')).toBe(true)
        expect(isValidHttpUrl('http://example.com/path?query=value')).toBe(true)
        expect(isValidHttpUrl('http://example.com:8080')).toBe(true)
      })

      it('should accept valid HTTPS URLs', () => {
        expect(isValidHttpUrl('https://example.com')).toBe(true)
        expect(isValidHttpUrl('https://example.com/path')).toBe(true)
        expect(isValidHttpUrl('https://example.com/path?query=value')).toBe(true)
        expect(isValidHttpUrl('https://subdomain.example.com')).toBe(true)
      })

      it('should handle URLs with special characters', () => {
        expect(isValidHttpUrl('https://example.com/path?foo=bar&baz=qux')).toBe(true)
        expect(isValidHttpUrl('https://example.com/path#hash')).toBe(true)
        expect(isValidHttpUrl('https://example.com/path%20with%20spaces')).toBe(true)
      })

      it('should handle URLs with authentication', () => {
        expect(isValidHttpUrl('https://user:pass@example.com')).toBe(true)
      })

      it('should be case-insensitive for protocol', () => {
        expect(isValidHttpUrl('HTTP://example.com')).toBe(true)
        expect(isValidHttpUrl('HTTPS://example.com')).toBe(true)
        expect(isValidHttpUrl('HtTpS://example.com')).toBe(true)
      })
    })

    describe('Invalid URLs - Security Threats', () => {
      it('should reject javascript: protocol (XSS attack)', () => {
        expect(isValidHttpUrl('javascript:alert("XSS")')).toBe(false)
        expect(isValidHttpUrl('javascript:void(0)')).toBe(false)
        expect(isValidHttpUrl('JAVASCRIPT:alert(1)')).toBe(false)
      })

      it('should reject data: protocol (XSS attack)', () => {
        expect(isValidHttpUrl('data:text/html,<script>alert("XSS")</script>')).toBe(false)
        expect(isValidHttpUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBe(false)
        expect(isValidHttpUrl('DATA:text/plain,test')).toBe(false)
      })

      it('should reject file: protocol (local file access)', () => {
        expect(isValidHttpUrl('file:///etc/passwd')).toBe(false)
        expect(isValidHttpUrl('file://C:/Windows/System32')).toBe(false)
        expect(isValidHttpUrl('FILE:///path/to/file')).toBe(false)
      })

      it('should reject vbscript: protocol', () => {
        expect(isValidHttpUrl('vbscript:msgbox("XSS")')).toBe(false)
      })

      it('should reject about: protocol', () => {
        expect(isValidHttpUrl('about:blank')).toBe(false)
      })

      it('should reject blob: protocol', () => {
        expect(isValidHttpUrl('blob:https://example.com/uuid')).toBe(false)
      })

      it('should reject custom protocols', () => {
        expect(isValidHttpUrl('custom://example.com')).toBe(false)
        expect(isValidHttpUrl('ftp://example.com')).toBe(false)
        expect(isValidHttpUrl('tel:+1234567890')).toBe(false)
        expect(isValidHttpUrl('mailto:user@example.com')).toBe(false)
      })
    })

    describe('Invalid URLs - Malformed Input', () => {
      it('should reject empty strings', () => {
        expect(isValidHttpUrl('')).toBe(false)
      })

      it('should reject whitespace-only strings', () => {
        expect(isValidHttpUrl('   ')).toBe(false)
        expect(isValidHttpUrl('\t')).toBe(false)
        expect(isValidHttpUrl('\n')).toBe(false)
      })

      it('should reject null and undefined', () => {
        expect(isValidHttpUrl(null)).toBe(false)
        expect(isValidHttpUrl(undefined)).toBe(false)
      })

      it('should reject non-string types', () => {
        expect(isValidHttpUrl(123 as any)).toBe(false)
        expect(isValidHttpUrl({} as any)).toBe(false)
        expect(isValidHttpUrl([] as any)).toBe(false)
        expect(isValidHttpUrl(true as any)).toBe(false)
      })

      it('should reject malformed URLs', () => {
        expect(isValidHttpUrl('not a url')).toBe(false)
        expect(isValidHttpUrl('example.com')).toBe(false) // Missing protocol
        expect(isValidHttpUrl('//example.com')).toBe(false) // Protocol-relative
        expect(isValidHttpUrl('ht tp://example.com')).toBe(false) // Space in protocol
      })

      it('should reject URLs with only protocol', () => {
        expect(isValidHttpUrl('http://')).toBe(false)
        expect(isValidHttpUrl('https://')).toBe(false)
      })
    })

    describe('Edge Cases', () => {
      it('should handle URLs with whitespace padding', () => {
        expect(isValidHttpUrl('  https://example.com  ')).toBe(true)
        expect(isValidHttpUrl('\thttps://example.com\t')).toBe(true)
      })

      it('should handle very long URLs', () => {
        const longPath = 'a'.repeat(2000)
        expect(isValidHttpUrl(`https://example.com/${longPath}`)).toBe(true)
      })

      it('should handle international domain names', () => {
        expect(isValidHttpUrl('https://münchen.de')).toBe(true)
        expect(isValidHttpUrl('https://例え.jp')).toBe(true)
      })

      it('should handle IPv4 addresses', () => {
        expect(isValidHttpUrl('http://192.168.1.1')).toBe(true)
        expect(isValidHttpUrl('https://127.0.0.1:8080')).toBe(true)
      })

      it('should handle IPv6 addresses', () => {
        expect(isValidHttpUrl('http://[::1]')).toBe(true)
        expect(isValidHttpUrl('https://[2001:db8::1]')).toBe(true)
      })
    })
  })

  describe('getSafeImageUrl', () => {
    describe('Valid URLs', () => {
      it('should return the URL unchanged for valid HTTP URLs', () => {
        expect(getSafeImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg')
      })

      it('should return the URL unchanged for valid HTTPS URLs', () => {
        expect(getSafeImageUrl('https://example.com/image.png')).toBe('https://example.com/image.png')
      })

      it('should trim whitespace from valid URLs', () => {
        expect(getSafeImageUrl('  https://example.com/image.jpg  ')).toBe('https://example.com/image.jpg')
      })
    })

    describe('Invalid URLs - Security Fallback', () => {
      it('should return fallback for javascript: protocol', () => {
        expect(getSafeImageUrl('javascript:alert("XSS")')).toBe('/placeholder-image.png')
      })

      it('should return fallback for data: protocol', () => {
        expect(getSafeImageUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBe('/placeholder-image.png')
      })

      it('should return fallback for file: protocol', () => {
        expect(getSafeImageUrl('file:///etc/passwd')).toBe('/placeholder-image.png')
      })

      it('should return fallback for any dangerous protocol', () => {
        expect(getSafeImageUrl('vbscript:msgbox(1)')).toBe('/placeholder-image.png')
        expect(getSafeImageUrl('blob:https://example.com/uuid')).toBe('/placeholder-image.png')
      })
    })

    describe('Invalid URLs - Malformed Input', () => {
      it('should return fallback for null', () => {
        expect(getSafeImageUrl(null)).toBe('/placeholder-image.png')
      })

      it('should return fallback for undefined', () => {
        expect(getSafeImageUrl(undefined)).toBe('/placeholder-image.png')
      })

      it('should return fallback for empty string', () => {
        expect(getSafeImageUrl('')).toBe('/placeholder-image.png')
      })

      it('should return fallback for whitespace-only', () => {
        expect(getSafeImageUrl('   ')).toBe('/placeholder-image.png')
      })

      it('should return fallback for malformed URLs', () => {
        expect(getSafeImageUrl('not a url')).toBe('/placeholder-image.png')
        expect(getSafeImageUrl('example.com/image.jpg')).toBe('/placeholder-image.png')
      })
    })

    describe('Custom Fallback', () => {
      it('should use custom fallback when provided', () => {
        expect(getSafeImageUrl('javascript:alert(1)', '/custom-fallback.jpg')).toBe('/custom-fallback.jpg')
        expect(getSafeImageUrl(null, 'https://example.com/default.png')).toBe('https://example.com/default.png')
      })

      it('should use custom fallback for invalid URLs', () => {
        expect(getSafeImageUrl('', '/empty.png')).toBe('/empty.png')
        expect(getSafeImageUrl('not-a-url', '/error.png')).toBe('/error.png')
      })
    })

    describe('Edge Cases', () => {
      it('should handle URLs with query parameters', () => {
        const url = 'https://example.com/image.jpg?w=800&h=600'
        expect(getSafeImageUrl(url)).toBe(url)
      })

      it('should handle CDN URLs', () => {
        const url = 'https://cdn.example.com/images/product-123.webp'
        expect(getSafeImageUrl(url)).toBe(url)
      })
    })
  })

  describe('sanitizeText', () => {
    describe('HTML Tag Removal', () => {
      it('should remove script tags', () => {
        expect(sanitizeText('<script>alert("XSS")</script>')).toBe('')
        expect(sanitizeText('Hello<script>alert(1)</script>World')).toBe('HelloWorld')
      })

      it('should remove img tags', () => {
        expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('')
        expect(sanitizeText('Text<img src="bad.jpg">More text')).toBe('TextMore text')
      })

      it('should remove all HTML tags', () => {
        expect(sanitizeText('<div>Content</div>')).toBe('Content')
        expect(sanitizeText('<p>Paragraph</p>')).toBe('Paragraph')
        expect(sanitizeText('<a href="http://evil.com">Link</a>')).toBe('Link')
        expect(sanitizeText('<span style="color:red">Text</span>')).toBe('Text')
      })

      it('should remove self-closing tags', () => {
        expect(sanitizeText('Text<br/>More')).toBe('TextMore')
        expect(sanitizeText('Line 1<hr/>Line 2')).toBe('Line 1Line 2')
      })

      it('should remove tags with attributes', () => {
        expect(sanitizeText('<div class="evil" onclick="alert(1)">Text</div>')).toBe('Text')
        expect(sanitizeText('<input type="text" value="dangerous">')).toBe('')
      })

      it('should remove nested tags', () => {
        expect(sanitizeText('<div><span><b>Bold</b></span></div>')).toBe('Bold')
        expect(sanitizeText('<ul><li>Item 1</li><li>Item 2</li></ul>')).toBe('Item 1Item 2')
      })
    })

    describe('XSS Attack Patterns', () => {
      it('should remove script tags with various casings', () => {
        expect(sanitizeText('<SCRIPT>alert(1)</SCRIPT>')).toBe('')
        expect(sanitizeText('<ScRiPt>alert(1)</ScRiPt>')).toBe('')
      })

      it('should remove iframe tags', () => {
        expect(sanitizeText('<iframe src="http://evil.com"></iframe>')).toBe('')
      })

      it('should remove object and embed tags', () => {
        expect(sanitizeText('<object data="evil.swf"></object>')).toBe('')
        expect(sanitizeText('<embed src="evil.swf">')).toBe('')
      })

      it('should remove svg tags with event handlers', () => {
        expect(sanitizeText('<svg onload=alert(1)></svg>')).toBe('')
      })

      it('should remove form elements', () => {
        expect(sanitizeText('<form><input name="password"></form>')).toBe('')
      })
    })

    describe('Text Preservation', () => {
      it('should preserve plain text', () => {
        expect(sanitizeText('Hello, World!')).toBe('Hello, World!')
        expect(sanitizeText('This is plain text.')).toBe('This is plain text.')
      })

      it('should preserve text with special characters', () => {
        expect(sanitizeText('Price: $19.99')).toBe('Price: $19.99')
        expect(sanitizeText('Discount: 20% off!')).toBe('Discount: 20% off!')
      })

      it('should preserve numbers and symbols', () => {
        expect(sanitizeText('Code: ABC-123-XYZ')).toBe('Code: ABC-123-XYZ')
        expect(sanitizeText('Email: user@example.com')).toBe('Email: user@example.com')
      })

      it('should preserve whitespace', () => {
        expect(sanitizeText('Line 1\nLine 2')).toBe('Line 1\nLine 2')
        expect(sanitizeText('Tab\there')).toBe('Tab\there')
      })

      it('should preserve unicode characters', () => {
        expect(sanitizeText('Hello 世界')).toBe('Hello 世界')
        expect(sanitizeText('Emoji: 🔒🛡️')).toBe('Emoji: 🔒🛡️')
      })
    })

    describe('Edge Cases - Invalid Input', () => {
      it('should return empty string for null', () => {
        expect(sanitizeText(null)).toBe('')
      })

      it('should return empty string for undefined', () => {
        expect(sanitizeText(undefined)).toBe('')
      })

      it('should return empty string for empty string', () => {
        expect(sanitizeText('')).toBe('')
      })

      it('should handle non-string types gracefully', () => {
        expect(sanitizeText(123 as any)).toBe('')
        expect(sanitizeText({} as any)).toBe('')
        expect(sanitizeText([] as any)).toBe('')
      })
    })

    describe('Edge Cases - Complex HTML', () => {
      it('should handle malformed HTML', () => {
        expect(sanitizeText('<div>Unclosed tag')).toBe('Unclosed tag')
        expect(sanitizeText('Unopened</div>')).toBe('Unopened')
      })

      it('should handle HTML comments', () => {
        expect(sanitizeText('Text<!-- comment -->More')).toBe('TextMore')
      })

      it('should handle CDATA sections', () => {
        expect(sanitizeText('Text<![CDATA[data]]>More')).toBe('TextMore')
      })

      it('should handle very long strings with tags', () => {
        const longText = 'a'.repeat(10000)
        expect(sanitizeText(`<div>${longText}</div>`)).toBe(longText)
      })

      it('should handle mixed content', () => {
        const input = 'Hello <b>bold</b> and <i>italic</i> text!'
        expect(sanitizeText(input)).toBe('Hello bold and italic text!')
      })

      it('should handle HTML entities', () => {
        expect(sanitizeText('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
        expect(sanitizeText('&amp; &quot; &apos;')).toBe('&amp; &quot; &apos;')
      })
    })

    describe('Real-World Attack Vectors', () => {
      it('should prevent XSS via event handlers in tags', () => {
        expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('')
        expect(sanitizeText('<body onload=alert(1)>')).toBe('')
        expect(sanitizeText('<div onclick="malicious()">')).toBe('')
      })

      it('should prevent XSS via style attributes', () => {
        expect(sanitizeText('<div style="background:url(javascript:alert(1))">Text</div>')).toBe('Text')
      })

      it('should prevent XSS via data attributes', () => {
        expect(sanitizeText('<div data-evil="<script>alert(1)</script>">Text</div>')).toBe('Text')
      })

      it('should handle review content with HTML', () => {
        const maliciousReview = 'Great product! <script>stealCredentials()</script> Highly recommended!'
        expect(sanitizeText(maliciousReview)).toBe('Great product!  Highly recommended!')
      })

      it('should handle author names with HTML', () => {
        const maliciousAuthor = 'John<script>alert(1)</script>Doe'
        expect(sanitizeText(maliciousAuthor)).toBe('JohnDoe')
      })
    })
  })
})
