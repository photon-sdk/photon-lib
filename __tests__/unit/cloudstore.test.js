import mockAsyncStorage from '@react-native-async-storage/async-storage';
import * as CloudStore from '../../src/cloudstore';

describe('CloudStore unit test', () => {
  const keyId = '8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f';
  const phone = '+4917512345678';
  const email = 'jon.smith@example.com';
  const ciphertext = Buffer.from('encrypted stuff');

  beforeEach(() => {
    mockAsyncStorage.clear();
    mockAsyncStorage.getAllKeys.mockClear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
  });

  describe('putKey', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.putKey({ keyId })).rejects.toThrow(/Invalid/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(0);
    });

    it('store item', async () => {
      await CloudStore.putKey({ keyId, ciphertext });
      expect(mockAsyncStorage.setItem.mock.calls[0][0]).toBe('1_photon_key_id');
      expect(mockAsyncStorage.setItem.mock.calls[0][1]).toBe(keyId);
      expect(mockAsyncStorage.setItem.mock.calls[1][0]).toBe('1_8abe1a93');
      expect(mockAsyncStorage.setItem.mock.calls[1][1]).toMatch(/^{"keyId":.*"}$/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(2);
    });

    it('should not backup twice', async () => {
      await CloudStore.putKey({ keyId, ciphertext });
      await expect(CloudStore.putKey({ keyId, ciphertext })).rejects.toThrow(/already present/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(2);
    });
  });

  describe('getKey', () => {
    it('should not find item', async () => {
      const stored = await CloudStore.getKey();
      expect(stored).toBe(null);
    });

    it('should get stored item by userId number', async () => {
      await CloudStore.putKey({ keyId, ciphertext });
      const stored = await CloudStore.getKey();
      expect(stored).toEqual({
        keyId,
        ciphertext,
        time: expect.objectContaining(new Date()),
      });
    });
  });

  describe('removeKeyId', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.removeKeyId({ keyId: 'invalid' })).rejects.toThrow(/not found/);
      expect(mockAsyncStorage.removeItem.mock.calls.length).toBe(0);
    });

    it('should remove stored item', async () => {
      await CloudStore.putKey({ keyId, ciphertext });
      expect(await CloudStore.getKey()).toBeTruthy();
      await CloudStore.removeKeyId({ keyId });
      expect(await CloudStore.getKey()).toBe(null);
    });
  });

  describe('putPhone', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.putPhone({ userId: '' })).rejects.toThrow(/Invalid/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(0);
    });

    it('store item', async () => {
      await CloudStore.putPhone({ userId: phone });
      expect(mockAsyncStorage.setItem.mock.calls[0][0]).toBe('1_photon_phone');
      expect(mockAsyncStorage.setItem.mock.calls[0][1]).toBe(phone);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
    });
  });

  describe('getPhone', () => {
    it('should not find item', async () => {
      const stored = await CloudStore.getPhone();
      expect(stored).toBe(null);
    });

    it('should get stored item by userId number', async () => {
      await CloudStore.putPhone({ userId: phone });
      const stored = await CloudStore.getPhone();
      expect(stored).toEqual(phone);
    });
  });

  describe('removePhone', () => {
    it('should remove stored item', async () => {
      await CloudStore.putPhone({ userId: phone });
      expect(await CloudStore.getPhone()).toBeTruthy();
      await CloudStore.removePhone({ keyId });
      expect(await CloudStore.getPhone()).toBe(null);
    });
  });

  describe('putEmail', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.putEmail({ userId: '' })).rejects.toThrow(/Invalid/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(0);
    });

    it('store item', async () => {
      await CloudStore.putEmail({ userId: email });
      expect(mockAsyncStorage.setItem.mock.calls[0][0]).toBe('1_photon_email');
      expect(mockAsyncStorage.setItem.mock.calls[0][1]).toBe(email);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
    });
  });

  describe('getEmail', () => {
    it('should not find item', async () => {
      const stored = await CloudStore.getEmail();
      expect(stored).toBe(null);
    });

    it('should get stored item by userId number', async () => {
      await CloudStore.putEmail({ userId: email });
      const stored = await CloudStore.getEmail();
      expect(stored).toEqual(email);
    });
  });

  describe('removeEmail', () => {
    it('should remove stored item', async () => {
      await CloudStore.putEmail({ userId: email });
      expect(await CloudStore.getEmail()).toBeTruthy();
      await CloudStore.removeEmail({ keyId });
      expect(await CloudStore.getEmail()).toBe(null);
    });
  });
});
