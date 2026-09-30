/**
 * Cryptographic helper to securely hash passwords using Web Crypto API (SHA-256)
 * Never stores plain-text passwords.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates Indian mobile number format (+91 or 10 digits)
 * Returns formatted +91XXXXXXXXXX or null if invalid
 */
export function formatAndValidateMobile(input: string): { valid: boolean; formatted: string; error?: string } {
  let cleaned = input.trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Should be 10 digits starting with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    return {
      valid: false,
      formatted: input,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210 or +91 9876543210).',
    };
  }

  return {
    valid: true,
    formatted: `+91 ${cleaned}`,
  };
}

/**
 * Validates standard email address format
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}
