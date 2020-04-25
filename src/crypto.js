import { AES_GCM } from 'asmcrypto.js';
import { randomBytes } from './random';

export const KEY_LEN = 32; // size of the key in bytes
export const IV_LEN = 12; // size of the IV in bytes
export const TAG_LEN = 16; // size of the tag in bytes

/**
 * Encrypt a plaintext using AES-256-GCM (authenticated encryption)
 * @param  {Buffer} plaintext  The plaintext bytes
 * @param  {Buffer} key        The symmetric encryption key
 * @return {Promise<Buffer>}   The iv + encrypted ciphertext
 */
export async function encrypt(plaintext, key) {
  if (!Buffer.isBuffer(plaintext) || !Buffer.isBuffer(key) || key.length !== KEY_LEN) {
    throw new Error('Invalid args');
  }
  const iv = await randomBytes(IV_LEN);
  const p = new Uint8Array(plaintext);
  const k = new Uint8Array(key);
  const i = new Uint8Array(iv);
  const adata = new Uint8Array();
  const ct = AES_GCM.encrypt(p, k, i, adata, TAG_LEN);
  return Buffer.concat([iv, Buffer.from(ct.buffer)]);
}

/**
 * Decrypt a ciphertext using AES-256-GCM (authenticated encryption)
 * @param  {Buffer} ciphertext  The iv + ciphertext bytes
 * @param  {Buffer} key         The symmetric encryption key
 * @return {Promise<Buffer>}    The decrypted plaintext
 */
export async function decrypt(ciphertext, key) {
  if (!Buffer.isBuffer(ciphertext) || !Buffer.isBuffer(key) || key.length !== KEY_LEN) {
    throw new Error('Invalid args');
  }
  const iv = ciphertext.slice(0, IV_LEN);
  const ct = ciphertext.slice(IV_LEN);
  const c = new Uint8Array(ct);
  const k = new Uint8Array(key);
  const i = new Uint8Array(iv);
  const adata = new Uint8Array();
  const pt = AES_GCM.decrypt(c, k, i, adata, TAG_LEN);
  return Buffer.from(pt.buffer);
}

export async function generateKey() {
  return randomBytes(KEY_LEN);
}
