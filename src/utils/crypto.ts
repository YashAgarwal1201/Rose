// src/utils/crypto.ts

const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const DIGEST = "SHA-256";

/**
 * Generates a random salt.
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a random initialization vector (IV) for AES-GCM.
 */
export function generateIV(): string {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hashes a string (e.g. for verifying a PIN or recovery key).
 */
export async function hashString(text: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest(DIGEST, enc.encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derives an AES-GCM key from a password and salt using PBKDF2.
 */
export async function deriveAesKey(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const saltBuffer = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string (JSON payload) using AES-GCM.
 * Returns the ciphertext as a hex string and the IV used.
 */
export async function encryptData(
  key: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const ivHex = generateIV();
  const ivBuffer = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    key,
    enc.encode(plaintext)
  );

  const rawCiphertext = Array.from(new Uint8Array(encryptedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const ciphertext = `${ivHex}:${rawCiphertext}`;

  return { ciphertext, iv: ivHex };
}

/**
 * Decrypts a ciphertext hex string using AES-GCM.
 * Returns the plaintext string.
 */
export async function decryptData(
  key: CryptoKey,
  ciphertextString: string,
  fallbackIvHex: string | null
): Promise<string> {
  let actualIvHex = fallbackIvHex;
  let actualCiphertextHex = ciphertextString;

  if (ciphertextString.includes(":")) {
    const parts = ciphertextString.split(":");
    actualIvHex = parts[0];
    actualCiphertextHex = parts[1];
  }

  if (!actualIvHex) throw new Error("No IV provided");

  const ivBuffer = new Uint8Array(
    actualIvHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const cipherBuffer = new Uint8Array(
    actualCiphertextHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    key,
    cipherBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Helper to generate a friendly 16-character recovery key
 */
export function generateRecoveryKey(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

/**
 * Encrypts a specific string field on an object, replacing it with ciphertext and saving the IV.
 */
export async function encryptField<T extends { iv: string | null }>(
  key: CryptoKey,
  item: T,
  fieldName: keyof T,
): Promise<void> {
  const value = item[fieldName];
  if (typeof value !== "string" || !value) return;
  const { ciphertext, iv } = await encryptData(key, value);
  item[fieldName] = ciphertext as any;
  item.iv = iv;
}

/**
 * Decrypts a specific string field on an object using its stored IV.
 */
export async function decryptField<T extends { iv: string | null }>(
  key: CryptoKey,
  item: T,
  fieldName: keyof T,
): Promise<void> {
  const value = item[fieldName];
  if (typeof value !== "string" || !value || !item.iv) return;
  try {
    const plaintext = await decryptData(key, value, item.iv);
    item[fieldName] = plaintext as any;
  } catch (e) {
    console.error(`Failed to decrypt field ${String(fieldName)}`);
  }
}

/**
 * Encrypts an object (JSON) field.
 */
export async function encryptJSONField<T extends { iv: string | null }>(
  key: CryptoKey,
  item: T,
  fieldName: keyof T,
): Promise<void> {
  const value = item[fieldName];
  if (!value) return;
  const { ciphertext, iv } = await encryptData(key, JSON.stringify(value));
  item[fieldName] = ciphertext as any;
  item.iv = iv;
}

/**
 * Decrypts an object (JSON) field.
 */
export async function decryptJSONField<T extends { iv: string | null }>(
  key: CryptoKey,
  item: T,
  fieldName: keyof T,
): Promise<void> {
  const value = item[fieldName];
  if (typeof value !== "string" || !value || !item.iv) return;
  try {
    const plaintext = await decryptData(key, value, item.iv);
    item[fieldName] = JSON.parse(plaintext) as any;
  } catch (e) {
    console.error(`Failed to decrypt JSON field ${String(fieldName)}`);
  }
}

