import crypto from 'crypto';
import * as gcm from '../../src/gcm';

const IV_LEN = gcm.IV_LEN;
const TAG_LEN = gcm.TAG_LEN;

describe('GCM unit test', () => {
  describe('generateKey', () => {
    it('generate a random buffer', async () => {
      const key = await gcm.generateKey();
      expect(key.length).toBe(32);
      expect(key.toString('hex')).toBeDefined();
    });
  });

  describe('encrypt', () => {
    it('fail on invalid key size', async () => {
      const key = Buffer.from('too short', 'utf8');
      const pt = Buffer.from('secret stuff', 'utf8');
      await expect(gcm.encrypt(pt, key)).rejects.toThrow(/Invalid/);
    });

    it('be decodable by node api', async () => {
      const key = await gcm.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await gcm.encrypt(pt, key);
      const decrypted = await nodeDecrypt(ct, key);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });

  describe('decrypt', () => {
    it('fail on invalid key size', async () => {
      const key = await gcm.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const shortKey = Buffer.from('too short', 'utf8');
      await expect(gcm.decrypt(ct, shortKey)).rejects.toThrow(/Invalid/);
    });

    it('fail on wrong key', async () => {
      const key = await gcm.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const wrongKey = await gcm.generateKey();
      await expect(gcm.decrypt(ct, wrongKey)).rejects.toThrow(/integrity check/);
    });

    it('decode node api ciphertext', async () => {
      const key = await gcm.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await nodeEncrypt(pt, key);
      const decrypted = await gcm.decrypt(ct, key);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });
});

async function nodeEncrypt(pt, key) {
  const iv = await crypto.randomBytes(IV_LEN);
  const en = crypto.createCipheriv('aes-256-gcm', key, iv);
  en.setAAD(Buffer.alloc(0));
  return Buffer.concat([iv, en.update(pt), en.final(), en.getAuthTag()]);
}

async function nodeDecrypt(ciphertext, key) {
  const iv = ciphertext.slice(0, IV_LEN);
  const ct = ciphertext.slice(IV_LEN);
  const de = crypto.createDecipheriv('aes-256-gcm', key, iv);
  de.setAAD(Buffer.alloc(0));
  de.setAuthTag(ct.slice(ct.length - TAG_LEN, ct.length));
  return Buffer.concat([de.update(ct.slice(0, ct.length - TAG_LEN)), de.final()]);
}
