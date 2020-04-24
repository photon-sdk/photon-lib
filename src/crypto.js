import { AES_GCM } from 'asmcrypto.js';
import { randomBytes } from './random';

export const ALGO = 'AES-256-GCM';
export const KEY_LEN = 32; // size of the key in bytes
export const IV_LEN = 12; // size of the IV in bytes
export const TAG_LEN = 16; // size of the tag in bytes

/**
 * Encrypt a plaintext using AES-256-GCM (authenticated encryption)
 * @param  {Buffer} plaintext  The plaintext bytes
 * @param  {Buffer} key        The symmetric encryption key
 * @param  {Buffer} iv         The initialisation vector
 * @return {Promise<Buffer>}   The encrypted ciphertext
 */
export async function encrypt(plaintext, key, iv) {
  if (!Buffer.isBuffer(plaintext) || !Buffer.isBuffer(key) || key.length !== KEY_LEN || !Buffer.isBuffer(iv) || iv.length !== IV_LEN) {
    throw new Error('Invalid args');
  }
  const p = new Uint8Array(plaintext);
  const k = new Uint8Array(key);
  const i = new Uint8Array(iv);
  const adata = new Uint8Array();
  const ct = AES_GCM.encrypt(p, k, i, adata, TAG_LEN);
  return Promise.resolve(Buffer.from(ct.buffer));
}

/**
 * Decrypt a ciphertext using AES-256-GCM (authenticated encryption)
 * @param  {Buffer} ciphertext  The ciphertext bytes
 * @param  {Buffer} key         The symmetric encryption key
 * @param  {Buffer} iv          The initialisation vector
 * @return {Promise<Buffer>}    The decrypted plaintext
 */
export async function decrypt(ciphertext, key, iv) {
  if (!Buffer.isBuffer(ciphertext) || !Buffer.isBuffer(key) || key.length !== KEY_LEN || !Buffer.isBuffer(iv) || iv.length !== IV_LEN) {
    throw new Error('Invalid args');
  }
  const c = new Uint8Array(ciphertext);
  const k = new Uint8Array(key);
  const i = new Uint8Array(iv);
  const adata = new Uint8Array();
  const pt = AES_GCM.decrypt(c, k, i, adata, TAG_LEN);
  return Promise.resolve(Buffer.from(pt.buffer));
}

export async function generateKey() {
  return randomBytes(KEY_LEN);
}

export async function generateIV() {
  return randomBytes(IV_LEN);
}

export function toWireFormat(ciphertext, iv) {
  return {
    ct: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function parseWireFormat({ ct, iv }) {
  return {
    ciphertext: Buffer.from(ct, 'base64'),
    iv: Buffer.from(iv, 'base64'),
  };
}
