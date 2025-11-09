import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Email validation service
export class EmailValidationService {
  constructor() {
    // Common disposable email domains
    this.disposableDomains = new Set([
      'tempmail.com',
      'throwaway.email',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      'fakeinbox.com',
      'temp-mail.org'
    ]);

    // Common role-based email prefixes
    this.roleBasedPrefixes = new Set([
      'admin',
      'administrator',
      'info',
      'support',
      'sales',
      'marketing',
      'noreply',
      'no-reply',
      'postmaster',
      'webmaster',
      'contact',
      'help',
      'billing'
    ]);
  }

  // Basic email format validation
  isValidFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check if email is from a disposable domain
  isDisposable(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    return this.disposableDomains.has(domain);
  }

  // Check if email is role-based
  isRoleBased(email) {
    const prefix = email.split('@')[0]?.toLowerCase();
    return this.roleBasedPrefixes.has(prefix);
  }

  // Validate email domain has MX records
  async hasMxRecords(email) {
    try {
      const domain = email.split('@')[1];
      const mxRecords = await resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Check for common typos in popular domains
  suggestCorrection(email) {
    const commonDomains = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'outloook.com': 'outlook.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com'
    };

    const domain = email.split('@')[1]?.toLowerCase();
    if (commonDomains[domain]) {
      const prefix = email.split('@')[0];
      return `${prefix}@${commonDomains[domain]}`;
    }

    return null;
  }

  // Comprehensive email validation
  async validateEmail(email) {
    const results = {
      email,
      isValid: false,
      formatValid: false,
      mxValid: false,
      isDisposable: false,
      isRoleBased: false,
      suggestion: null,
      score: 0, // 0-100
      errors: []
    };

    // Format validation
    results.formatValid = this.isValidFormat(email);
    if (!results.formatValid) {
      results.errors.push('Invalid email format');
      return results;
    }

    // Disposable check
    results.isDisposable = this.isDisposable(email);
    if (results.isDisposable) {
      results.errors.push('Disposable email address');
      results.score -= 50;
    }

    // Role-based check
    results.isRoleBased = this.isRoleBased(email);
    if (results.isRoleBased) {
      results.errors.push('Role-based email address');
      results.score -= 20;
    }

    // Typo suggestion
    results.suggestion = this.suggestCorrection(email);
    if (results.suggestion) {
      results.errors.push(`Did you mean ${results.suggestion}?`);
      results.score -= 10;
    }

    // MX record validation
    results.mxValid = await this.hasMxRecords(email);
    if (!results.mxValid) {
      results.errors.push('Domain has no valid MX records');
      results.score -= 30;
    }

    // Calculate final score
    results.score = Math.max(0, 100 + results.score);

    // Mark as valid if score is above threshold
    results.isValid = results.score >= 60 && results.formatValid && results.mxValid;

    return results;
  }

  // Bulk email validation
  async validateEmails(emails) {
    const results = await Promise.all(
      emails.map(email => this.validateEmail(email))
    );

    return {
      total: emails.length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid).length,
      results
    };
  }

  // Extract email from string
  extractEmail(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
  }

  // Normalize email (lowercase, trim)
  normalizeEmail(email) {
    if (!email) return null;

    let normalized = email.toLowerCase().trim();

    // Remove dots from Gmail addresses (Gmail ignores them)
    const [localPart, domain] = normalized.split('@');
    if (domain === 'gmail.com') {
      // Remove dots and everything after +
      const cleanLocal = localPart.split('+')[0].replace(/\./g, '');
      normalized = `${cleanLocal}@${domain}`;
    }

    return normalized;
  }

  // Check if email is a catch-all domain
  async isCatchAll(email) {
    const domain = email.split('@')[1];
    const testEmail = `nonexistent-${Date.now()}@${domain}`;

    try {
      // This is a simplified check - in production, use an SMTP verification service
      const mxRecords = await resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch {
      return false;
    }
  }
}

export default new EmailValidationService();
