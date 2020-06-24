import mockAsyncStorage from '@react-native-community/async-storage';
import * as CloudStore from '../../src/cloudstore';

describe('CloudStore unit test', () => {
  const keyId = '8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f';
  const userId = '+4917512345678';
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

    it('should not backup twice', async () => {
      await CloudStore.putKey({ keyId, ciphertext });
      await expect(CloudStore.putKey({ keyId, ciphertext })).rejects.toThrow(/already present/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
    });

    it('store item', async () => {
      await CloudStore.putKey({ keyId, ciphertext });
      expect(mockAsyncStorage.setItem.mock.calls[0][0]).toBe('0_photon_key');
      expect(mockAsyncStorage.setItem.mock.calls[0][1]).toMatch(/^{"keyId":.*"}$/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
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

  describe('removeKey', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.removeKey({ keyId: 'invalid' })).rejects.toThrow(/not found/);
      expect(mockAsyncStorage.removeItem.mock.calls.length).toBe(0);
    });

    it('should remove stored item', async () => {
      await CloudStore.putKey({ keyId, ciphertext });
      expect(await CloudStore.getKey()).toBeTruthy();
      await CloudStore.removeKey({ keyId });
      expect(await CloudStore.getKey()).toBe(null);
    });
  });

  describe('putUser', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.putUser({ keyId })).rejects.toThrow(/Invalid/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(0);
    });

    it('should not backup twice', async () => {
      await CloudStore.putUser({ keyId, userId });
      await expect(CloudStore.putUser({ keyId, userId })).rejects.toThrow(/already present/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
    });

    it('store item', async () => {
      await CloudStore.putUser({ keyId, userId });
      expect(mockAsyncStorage.setItem.mock.calls[0][0]).toBe('0_photon_uid');
      expect(mockAsyncStorage.setItem.mock.calls[0][1]).toMatch(/^{"keyId":.*"}$/);
      expect(mockAsyncStorage.setItem.mock.calls.length).toBe(1);
    });
  });

  describe('getUser', () => {
    it('should not find item', async () => {
      const stored = await CloudStore.getUser();
      expect(stored).toBe(null);
    });

    it('should get stored item by userId number', async () => {
      await CloudStore.putUser({ keyId, userId });
      const stored = await CloudStore.getUser();
      expect(stored).toEqual({ keyId, userId });
    });
  });

  describe('removeUser', () => {
    it('fail on invalid args', async () => {
      await expect(CloudStore.removeUser({ keyId: 'invalid' })).rejects.toThrow(/not found/);
      expect(mockAsyncStorage.removeItem.mock.calls.length).toBe(0);
    });

    it('should remove stored item', async () => {
      await CloudStore.putUser({ keyId, userId });
      expect(await CloudStore.getUser()).toBeTruthy();
      await CloudStore.removeUser({ keyId });
      expect(await CloudStore.getUser()).toBe(null);
    });
  });
});
