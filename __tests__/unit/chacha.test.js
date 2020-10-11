import nodeCrypto from 'crypto';
import { randomBytes } from '../../src/wallet/rng';
import * as chacha from '../../src/chacha';

const IV_LEN = chacha.IV_LEN;
const TAG_LEN = chacha.TAG_LEN;

describe('Chacha20-Poly1305 unit test', () => {
  describe('generateKey', () => {
    it('generate a random buffer', async () => {
      const key = await chacha.generateKey();
      expect(key.length).toBe(32);
      expect(key.toString('hex')).toBeDefined();
    });
  });

  describe('encrypt', () => {
    it('fail on invalid key size', async () => {
      const key = Buffer.from('too short', 'utf8');
      const pt = Buffer.from('secret stuff', 'utf8');
      await expect(chacha.encrypt(pt, key)).rejects.toThrow(/Invalid/);
    });

    it('be decodable by node api', async () => {
      const key = await chacha.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await chacha.encrypt(pt, key);
      console.log(key);
      console.log('plain text:' + pt);
      console.log(ct);
      const decrypted = await nodeDecrypt(ct, key);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });

  describe('decrypt', () => {
    it('fail on invalid key size', async () => {
      const key = await chacha.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const shortKey = Buffer.from('too short', 'utf8');
      await expect(chacha.decrypt(ct, shortKey)).rejects.toThrow(/Invalid/);
    });

    it('fail on wrong key', async () => {
      const key = await chacha.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const wrongKey = await chacha.generateKey();
      await expect(chacha.decrypt(ct, wrongKey)).rejects.toThrow(/unable to authenticate/);
    });

    it('decode node api ciphertext', async () => {
      const key = await chacha.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const decrypted = await chacha.decrypt(ct, key);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });
});

async function nodeEncrypt(pt, key) {
  const iv = await randomBytes(IV_LEN);
  const en = nodeCrypto.createCipheriv('chacha20-poly1305', key, iv, {
    authTagLength: TAG_LEN,
  });
  en.setAAD(Buffer.alloc(0));
  return Buffer.concat([iv, en.update(pt), en.final(), en.getAuthTag()]);
}

async function nodeDecrypt(ciphertext, key) {
  const iv = ciphertext.slice(0, IV_LEN);
  const ct = ciphertext.slice(IV_LEN);
  const de = nodeCrypto.createDecipheriv('chacha20-poly1305', key, iv, {
    authTagLength: TAG_LEN,
  });
  de.setAAD(Buffer.alloc(0));
  de.setAuthTag(ct.slice(ct.length - TAG_LEN, ct.length));
  return Buffer.concat([de.update(ct.slice(0, ct.length - TAG_LEN)), de.final()]);
}
