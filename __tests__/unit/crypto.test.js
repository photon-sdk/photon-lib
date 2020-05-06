import nodeCrypto from 'crypto';
import { promisify } from 'util';
import * as Crypto from '../../src/crypto';
const randomBytes = promisify(nodeCrypto.randomBytes);

const IV_LEN = Crypto.IV_LEN;
const TAG_LEN = Crypto.TAG_LEN;

describe('Crypto unit test', () => {
  describe('generateKey', () => {
    it('generate a random buffer', async () => {
      const key = await Crypto.generateKey();
      expect(key.length).toBe(32);
      expect(key.toString('hex')).toBeDefined();
    });
  });

  describe('encrypt', () => {
    it('fail on invalid key size', async () => {
      const key = Buffer.from('too short', 'utf8');
      const pt = Buffer.from('secret stuff', 'utf8');
      await expect(Crypto.encrypt(pt, key)).rejects.toThrow(/Invalid/);
    });

    it('be decodable by node api', async () => {
      const key = await Crypto.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await Crypto.encrypt(pt, key);
      const decrypted = await nodeDecrypt(ct, key);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });

  describe('decrypt', () => {
    it('fail on invalid key size', async () => {
      const key = await Crypto.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const shortKey = Buffer.from('too short', 'utf8');
      await expect(Crypto.decrypt(ct, shortKey)).rejects.toThrow(/Invalid/);
    });

    it('fail on wrong key', async () => {
      const key = await Crypto.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const wrongKey = await Crypto.generateKey();
      await expect(Crypto.decrypt(ct, wrongKey)).rejects.toThrow(/integrity check/);
    });

    it('decode node api ciphertext', async () => {
      const key = await Crypto.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const decrypted = await Crypto.decrypt(ct, key);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });
});

async function nodeEncrypt(pt, key) {
  const iv = await randomBytes(IV_LEN);
  const en = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
  en.setAAD(Buffer.alloc(0));
  return Buffer.concat([iv, en.update(pt), en.final(), en.getAuthTag()]);
}

async function nodeDecrypt(ciphertext, key) {
  const iv = ciphertext.slice(0, IV_LEN);
  const ct = ciphertext.slice(IV_LEN);
  const de = nodeCrypto.createDecipheriv('aes-256-gcm', key, iv);
  de.setAAD(Buffer.alloc(0));
  de.setAuthTag(ct.slice(ct.length - TAG_LEN, ct.length));
  return Buffer.concat([de.update(ct.slice(0, ct.length - TAG_LEN)), de.final()]);
}
