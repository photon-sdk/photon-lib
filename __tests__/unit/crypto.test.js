import nodeCrypto from 'crypto';
import { randomBytes } from '../../src/random';
import { Crypto } from '../../';

const IV_LEN = Crypto.IV_LEN;
const TAG_LEN = Crypto.TAG_LEN;

describe('Crypto unit test', () => {
  describe('encrypt', () => {
    it('be decodable by node api', async () => {
      const key = await Crypto.generateKey();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await Crypto.encrypt(pt, key);
      const decrypted = await nodeDecrypt(ct, key);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });

  describe('decrypt', () => {
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
