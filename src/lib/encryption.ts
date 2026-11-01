import CryptoJS from 'crypto-js';

// This is a server-only module.
// The private key should never be exposed to the client.

const privateKey = process.env.ENCRYPTION_KEY;

if (!privateKey) {
  console.error("❌ [Encryption] CRITICAL ERROR: ENCRYPTION_KEY is not defined in environment variables. Decryption will fail.");
}

/**
 * Encrypts a string using AES.
 */
export function encrypt(text: string): string {
  if (!text || !privateKey) return text;
  try {
    return CryptoJS.AES.encrypt(text, privateKey).toString();
  } catch (error) {
    console.error("❌ [Encryption] AES Encryption failed:", error);
    return text;
  }
}

/**
 * Decrypts a string using AES. Handles old, unencrypted data gracefully.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext || !privateKey) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, privateKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption results in an empty string, it's a sign of failure (e.g., wrong key).
    if (!originalText) {
      return ciphertext;
    }
    return originalText;
  } catch (error) {
    // If any other decryption error occurs, assume it's old, unencrypted data or wrong key.
    return ciphertext;
  }
}
