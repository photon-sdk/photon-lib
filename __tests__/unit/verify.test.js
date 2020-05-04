import * as verify from '../../src/verify';

describe('Verify unit test', () => {
  describe('isPhone', () => {
    it('returns true for a valid phone number', () => {
      expect(verify.isPhone('+4917512345678')).toBe(true);
    });

    it('returns false for an invalid phone number', () => {
      expect(verify.isPhone('+04917512345678')).toBe(false);
    });

    it('returns false for an invalid phone number', () => {
      expect(verify.isPhone('+4')).toBe(false);
    });

    it('returns false for an invalid phone number', () => {
      expect(verify.isPhone('004917512345678')).toBe(false);
    });

    it('returns false for null', () => {
      expect(verify.isPhone(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(verify.isPhone(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(verify.isPhone('')).toBe(false);
    });
  });

  describe('isCode', () => {
    it('returns true for a valid code', () => {
      expect(verify.isCode('000000')).toBe(true);
    });

    it('returns false for a non digit code', () => {
      expect(verify.isCode('00000a')).toBe(false);
    });

    it('returns false for a code that is too short', () => {
      expect(verify.isCode('00000')).toBe(false);
    });

    it('returns false for a code that is too long', () => {
      expect(verify.isCode('0000000')).toBe(false);
    });

    it('returns false for null', () => {
      expect(verify.isCode(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(verify.isCode(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(verify.isCode('')).toBe(false);
    });
  });

  describe('isId', () => {
    it('returns true for a valid uuid', () => {
      expect(verify.isId('8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f')).toBe(true);
    });

    it('returns false for an upper case uuid', () => {
      expect(verify.isId('8ABE1A93-6A9C-490C-BBD5-D7F11A4A9C8F')).toBe(false);
    });

    it('returns false for an invalid uuid', () => {
      expect(verify.isId('8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8')).toBe(false);
    });

    it('returns false for null', () => {
      expect(verify.isId(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(verify.isId(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(verify.isId('')).toBe(false);
    });
  });

  describe('isObject', () => {
    it('returns true for a valid Object', () => {
      expect(verify.isObject(new Object())).toBe(true); // eslint-disable-line
    });

    it('returns true for object literal', () => {
      expect(verify.isObject({})).toBe(true);
    });

    it('returns false for null', () => {
      expect(verify.isObject(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(verify.isObject(undefined)).toBe(false);
    });
  });

  describe('isString', () => {
    it('returns true for a String object', () => {
      expect(verify.isString(new String('foo'))).toBe(true); // eslint-disable-line
    });

    it('returns true for string', () => {
      expect(verify.isString('foo')).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(verify.isString('')).toBe(true);
    });

    it('returns false for null', () => {
      expect(verify.isString(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(verify.isString(undefined)).toBe(false);
    });
  });

  describe('isBuffer', () => {
    it('returns true for a valid Buffer', () => {
      expect(verify.isBuffer(Buffer.alloc(0))).toBe(true);
    });

    it('returns true for depricated constructor', () => {
      expect(verify.isBuffer(new Buffer(0))).toBe(true); // eslint-disable-line
    });

    it('returns false for Uint8Array', () => {
      expect(verify.isBuffer(new Uint8Array(0))).toBe(false);
    });

    it('returns false for null', () => {
      expect(verify.isBuffer(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(verify.isBuffer(undefined)).toBe(false);
    });
  });
});
