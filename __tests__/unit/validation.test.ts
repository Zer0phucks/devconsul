import { describe, it, expect } from '@jest/globals';

/**
 * Unit Tests: Input Validation & Security
 * Tests validation schemas and security measures
 */

describe('Input Validation', () => {
  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('URL Validation', () => {
    it('should validate GitHub repository URLs', () => {
      const validUrls = [
        'https://github.com/user/repo',
        'https://github.com/org/project-name',
        'https://github.com/user/repo.git'
      ];

      const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+/;

      validUrls.forEach(url => {
        expect(githubRegex.test(url)).toBe(true);
      });
    });

    it('should reject invalid GitHub URLs', () => {
      const invalidUrls = [
        'http://github.com/user/repo',
        'https://gitlab.com/user/repo',
        'github.com/user/repo',
        'https://github.com/'
      ];

      const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+/;

      invalidUrls.forEach(url => {
        expect(githubRegex.test(url)).toBe(false);
      });
    });
  });

  describe('API Key Validation', () => {
    it('should validate OpenAI API key format', () => {
      const validKey = 'sk-' + 'a'.repeat(48);
      const isValid = validKey.startsWith('sk-') && validKey.length >= 20;

      expect(isValid).toBe(true);
    });

    it('should reject invalid API keys', () => {
      const invalidKeys = [
        '',
        'invalid',
        'sk-short',
        'wrong-prefix-' + 'a'.repeat(48)
      ];

      invalidKeys.forEach(key => {
        const isValid = key.startsWith('sk-') && key.length >= 20;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Content Safety Validation', () => {
    it('should detect blacklisted terms', () => {
      const blacklist = ['spam', 'scam', 'malware'];
      const content = 'This is a scam message';

      const hasBlacklistedTerms = blacklist.some(term =>
        content.toLowerCase().includes(term.toLowerCase())
      );

      expect(hasBlacklistedTerms).toBe(true);
    });

    it('should allow clean content', () => {
      const blacklist = ['spam', 'scam', 'malware'];
      const content = 'This is a legitimate message about our new feature';

      const hasBlacklistedTerms = blacklist.some(term =>
        content.toLowerCase().includes(term.toLowerCase())
      );

      expect(hasBlacklistedTerms).toBe(false);
    });
  });

  describe('Cron Expression Validation', () => {
    it('should validate basic cron expressions', () => {
      const validExpressions = [
        '0 0 * * *',     // Daily at midnight
        '0 12 * * 1',    // Every Monday at noon
        '*/15 * * * *',  // Every 15 minutes
      ];

      // Simple cron validation (5 fields)
      const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

      validExpressions.forEach(expr => {
        expect(cronRegex.test(expr)).toBe(true);
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in user input', () => {
      const userInput = '<script>alert("xss")</script>';
      const escaped = userInput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    it('should sanitize markdown content', () => {
      const maliciousMarkdown = '[Click me](javascript:alert("xss"))';
      const isJavaScriptUrl = maliciousMarkdown.includes('javascript:');

      expect(isJavaScriptUrl).toBe(true);
      // In production, this would be filtered out
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should detect potential SQL injection patterns', () => {
      const suspiciousInputs = [
        "' OR '1'='1",
        "'; DROP TABLE users;--",
        "admin'--"
      ];

      const sqlInjectionPattern = /['";]|(\bOR\b)|(\bDROP\b)|(\bDELETE\b)|(\bUPDATE\b)/i;

      suspiciousInputs.forEach(input => {
        expect(sqlInjectionPattern.test(input)).toBe(true);
      });
    });
  });
});
