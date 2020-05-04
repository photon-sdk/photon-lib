import mockAsyncStorage from '@react-native-community/async-storage';
import * as CloudStore from '../../src/cloudstore';

describe('CloudStore unit test', () => {
  const keyId = '8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f';
  const phone = '+4917512345678';
  const ciphertext = Buffer.from('encrypted stuff');

  beforeEach(() => {
    mockAsyncStorage.clear();
    mockAsyncStorage.getAllKeys.mockClear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
  });

  describe('put', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.put({ keyId, phone })).rejects.toThrow(/Invalid/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(0);
    });

    it('should not backup twice', async () => {
      await CloudStore.put({ keyId, phone, ciphertext });
      await expect(CloudStore.put({ keyId, phone, ciphertext })).rejects.toThrow(/already present/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
    });

    it('store item', async () => {
      await CloudStore.put({ keyId, phone, ciphertext });
      expect(mockAsyncStorage.setItem.mock.calls[0][0]).toBe('0_8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f');
      expect(mockAsyncStorage.setItem.mock.calls[0][1]).toMatch(/^{"keyId":.*"}$/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
    });
  });

  describe('get', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.get({ phone: 'invalid' })).rejects.toThrow(/Invalid/);
      expect(mockAsyncStorage.getAllKeys.mock.calls.length).toBe(0);
    });

    it('should not find item', async () => {
      const stored = await CloudStore.get({ phone });
      expect(stored).toBe(null);
    });

    it('should not return backup for wrong phone number', async () => {
      await CloudStore.put({ keyId, phone, ciphertext });
      expect(await CloudStore.get({ phone })).toBeTruthy();
      const stored = await CloudStore.get({ phone: '+4917512345679' });
      expect(stored).toBe(null);
    });

    it('should get stored item by phone number', async () => {
      await CloudStore.put({ keyId, phone, ciphertext });
      const stored = await CloudStore.get({ phone });
      expect(stored).toEqual({
        keyId,
        phone,
        ciphertext,
        time: expect.objectContaining(new Date()),
      });
    });
  });

  describe('remove', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.remove({ keyId: 'invalid' })).rejects.toThrow(/Invalid/);
      expect(mockAsyncStorage.removeItem.mock.calls.length).toBe(0);
    });

    it('should remove stored item', async () => {
      await CloudStore.put({ keyId, phone, ciphertext });
      expect(await CloudStore.get({ phone })).toBeTruthy();
      await CloudStore.remove({ keyId });
      expect(await CloudStore.get({ phone })).toBe(null);
    });
  });
});
