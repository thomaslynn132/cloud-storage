/**
 * AES-256-GCM token encryption/decryption using Web Crypto API.
 * Works in browser, Edge Runtime, and Node.js 20+.
 *
 * Encrypted format: base64( iv(12) + ciphertext + tag(16) )
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const TAG_LENGTH = 128; // bits

function getPassphrase(): string {
  return (
    process.env.TOKEN_ENCRYPTION_KEY || "filehost-dev-key-change-in-production"
  );
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(passphrase),
  );
  return crypto.subtle.importKey("raw", hash, ALGORITHM, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await deriveKey(getPassphrase());
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoder.encode(plaintext),
  );
  // ciphertext from Web Crypto = iv + ciphertext + tag
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);
  return base64Encode(combined);
}

export async function decryptToken(encrypted: string): Promise<string> {
  const key = await deriveKey(getPassphrase());
  const combined = base64Decode(encrypted);
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    data,
  );
  return new TextDecoder().decode(decrypted);
}
