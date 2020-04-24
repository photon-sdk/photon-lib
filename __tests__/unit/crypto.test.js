import nodeCrypto from 'crypto';
import { Crypto } from '../../';

const TAG_LEN = Crypto.TAG_LEN;

describe('Crypto unit test', () => {
  describe('encrypt', () => {
    it('be decodable by node api', async () => {
      const key = await Crypto.generateKey();
      const iv = await Crypto.generateIV();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = await Crypto.encrypt(pt, key, iv);
      const decrypted = nodeDecrypt(ct, key, iv);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });

  describe('decrypt', () => {
    it('decode node api ciphertext', async () => {
      const key = await Crypto.generateKey();
      const iv = await Crypto.generateIV();
      const pt = Buffer.from('secret stuff', 'utf8');
      const ct = nodeEncrypt(pt, key, iv);
      const decrypted = await Crypto.decrypt(ct, key, iv);
      expect(decrypted.toString('utf8')).toBe('secret stuff');
    });
  });
});

function nodeEncrypt(pt, key, iv, adata = Buffer.alloc(0)) {
  const en = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
  en.setAAD(adata);
  return Buffer.concat([en.update(pt), en.final(), en.getAuthTag()]);
}

function nodeDecrypt(ct, key, iv, adata = Buffer.alloc(0)) {
  const de = nodeCrypto.createDecipheriv('aes-256-gcm', key, iv);
  de.setAAD(adata);
  de.setAuthTag(ct.slice(ct.length - TAG_LEN, ct.length));
  return Buffer.concat([de.update(ct.slice(0, ct.length - TAG_LEN)), de.final()]);
}
