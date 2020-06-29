import { KeyBackup } from '../../';
import * as _Keychain from '../../src/keychain';
import * as _CloudStore from '../../src/cloudstore';
import * as mockRNKeychain from 'react-native-keychain';
import { _api as mockKeyserverApi } from '../../src/keyserver';
import mockCloudStorage from '@react-native-community/async-storage';

describe('KeyBackup unit test', () => {
  const keyId = '8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f';
  const phone = '+4917512345678';
  const email = 'jon.smith@example.com';
  const pin = '1234';
  const newPin = '5678';
  const ciphertext = Buffer.from('sNz6ocyiJsIhC/48RhXdqZZyxQ/sFigpDbEpHE8UnSb2XxeIfCxB8Q==', 'base64');
  const encryptionKeyBase64 = '95frn7hTHLDN7wsd2sG+FwMMLxNsx4ZgGlgPHHBejKI=';
  const code = '000000';

  beforeEach(() => {
    // reset mocks
    mockRNKeychain._nuke();
    mockRNKeychain.setInternetCredentials.mockClear();
    mockRNKeychain.getInternetCredentials.mockClear();
    mockCloudStorage.clear();
    mockCloudStorage.getAllKeys.mockClear();
    mockCloudStorage.getItem.mockClear();
    mockCloudStorage.setItem.mockClear();
    mockCloudStorage.removeItem.mockClear();
    KeyBackup.init({ keyServerURI: 'http://localhost:8000' });
    expect(mockKeyserverApi.post.mock.calls.length).toBe(0);
    // set default mock return values
    mockKeyserverApi.post.mockResolvedValue({
      status: 201,
      body: { id: keyId },
    });
    mockKeyserverApi.get.mockResolvedValue({
      status: 200,
      body: {
        id: keyId,
        encryptionKey: encryptionKeyBase64,
      },
    });
    mockKeyserverApi.put.mockResolvedValue({
      status: 200,
      body: {},
    });
    mockKeyserverApi.delete.mockResolvedValue({
      status: 200,
      body: {},
    });
  });

  describe('checkForExistingBackup', () => {
    it('should not find backup', async () => {
      const exists = await KeyBackup.checkForExistingBackup();
      expect(exists).toBe(false);
    });

    it('should set key id if exisiting item exists', async () => {
      await _CloudStore.putKey({ keyId, ciphertext });
      const exists = await KeyBackup.checkForExistingBackup();
      expect(exists).toBe(true);
      expect(await _Keychain.getItem(KeyBackup.KEY_ID)).toBe(keyId);
    });
  });

  describe('createBackup', () => {
    beforeEach(async () => {
      expect(await KeyBackup.checkForExistingBackup()).toBe(false);
    });

    it('should fail on invalid data', async () => {
      await expect(KeyBackup.createBackup({ data: '', pin })).rejects.toThrow(/Invalid/);
    });

    it('should fail on invalid pin', async () => {
      await expect(KeyBackup.createBackup({ data: {}, pin: '' })).rejects.toThrow(/Invalid/);
    });

    it('should encrpt and store object', async () => {
      await KeyBackup.createBackup({ data: { foo: 'bar' }, pin });
      expect(await KeyBackup.checkForExistingBackup()).toBe(true);
    });
  });

  describe('restoreBackup', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: { foo: 'bar' }, pin });
      mockRNKeychain._nuke(); // simulate new unsynced device
      expect(await KeyBackup.checkForExistingBackup()).toBe(true);
    });

    it('should download and decrypt backup', async () => {
      const backup = await KeyBackup.restoreBackup({ pin });
      expect(backup.foo).toBe('bar');
    });

    it('should return null if no backup found', async () => {
      mockCloudStorage.clear();
      const backup = await KeyBackup.restoreBackup({ pin });
      expect(backup).toBe(null);
    });
  });

  describe('changePin', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
    });

    it('should fail for invalid new pin', async () => {
      await expect(KeyBackup.changePin({ pin })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.put.mock.calls.length).toBe(0);
    });

    it('should update pin in key server', async () => {
      await KeyBackup.changePin({ pin, newPin });
      expect(mockKeyserverApi.put.mock.calls.length).toBe(1);
    });
  });

  describe('registerPhone', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
    });

    it('should fail for invalid phone', async () => {
      await expect(KeyBackup.registerPhone({ userId: '', pin })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.post.mock.calls.length).toBe(1);
    });

    it('should set phone in key server', async () => {
      await KeyBackup.registerPhone({ userId: phone, pin });
      expect(mockKeyserverApi.post.mock.calls.length).toBe(2);
    });
  });

  describe('verifyPhone', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerPhone({ userId: phone, pin });
    });

    it('should fail for invalid code', async () => {
      await expect(KeyBackup.verifyPhone({ userId: phone, code: '' })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.put.mock.calls.length).toBe(0);
      expect(await _CloudStore.getPhone()).toBe(null);
    });

    it('should verify and store phone in cloud store', async () => {
      await KeyBackup.verifyPhone({ userId: phone, code });
      expect(mockKeyserverApi.put.mock.calls.length).toBe(1);
      expect(await _CloudStore.getPhone()).toBeDefined();
    });
  });

  describe('getPhone', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerPhone({ userId: phone, pin });
    });

    it('should return null if user was not verified', async () => {
      expect(await KeyBackup.getPhone()).toBe(null);
    });

    it('should return verified phone', async () => {
      await KeyBackup.verifyPhone({ userId: phone, code });
      expect(await KeyBackup.getPhone()).toBe(phone);
    });
  });

  describe('removePhone', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerPhone({ userId: phone, pin });
    });

    it('should delete verified phone', async () => {
      await KeyBackup.verifyPhone({ userId: phone, code });
      await KeyBackup.removePhone({ userId: phone, pin });
      expect(mockKeyserverApi.delete.mock.calls.length).toBe(1);
      expect(await KeyBackup.getPhone()).toBe(null);
    });
  });

  describe('registerEmail', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
    });

    it('should fail for invalid email', async () => {
      await expect(KeyBackup.registerEmail({ userId: '', pin })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.post.mock.calls.length).toBe(1);
    });

    it('should set email in key server', async () => {
      await KeyBackup.registerEmail({ userId: email, pin });
      expect(mockKeyserverApi.post.mock.calls.length).toBe(2);
    });
  });

  describe('verifyEmail', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerEmail({ userId: email, pin });
    });

    it('should fail for invalid code', async () => {
      await expect(KeyBackup.verifyEmail({ userId: email, code: '' })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.put.mock.calls.length).toBe(0);
      expect(await _CloudStore.getEmail()).toBe(null);
    });

    it('should verify and store email in cloud store', async () => {
      await KeyBackup.verifyEmail({ userId: email, code });
      expect(mockKeyserverApi.put.mock.calls.length).toBe(1);
      expect(await _CloudStore.getEmail()).toBeDefined();
    });
  });

  describe('getEmail', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerEmail({ userId: email, pin });
    });

    it('should return null if user was not verified', async () => {
      expect(await KeyBackup.getEmail()).toBe(null);
    });

    it('should return verified email', async () => {
      await KeyBackup.verifyEmail({ userId: email, code });
      expect(await KeyBackup.getEmail()).toBe(email);
    });
  });

  describe('removeEmail', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerEmail({ userId: email, pin });
    });

    it('should delete verified email', async () => {
      await KeyBackup.verifyEmail({ userId: email, code });
      await KeyBackup.removeEmail({ userId: email, pin });
      expect(mockKeyserverApi.delete.mock.calls.length).toBe(1);
      expect(await KeyBackup.getEmail()).toBe(null);
    });
  });

  describe('initPinReset', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerPhone({ userId: phone, pin });
      await KeyBackup.verifyPhone({ userId: phone, code });
    });

    it('should fail for invalid user id', async () => {
      await expect(KeyBackup.initPinReset({ userId: '' })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.get.mock.calls.length).toBe(1);
    });

    it('should call reset api in keyserver', async () => {
      await KeyBackup.initPinReset({ userId: phone });
      expect(mockKeyserverApi.get.mock.calls.length).toBe(2);
      expect(mockKeyserverApi.get.mock.calls[1][0]).toMatch(/reset$/);
    });
  });

  describe('verifyPinReset', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerPhone({ userId: phone, pin });
      await KeyBackup.verifyPhone({ userId: phone, code });
      await KeyBackup.initPinReset({ userId: phone });
    });

    it('should fail for invalid code', async () => {
      await expect(KeyBackup.verifyPinReset({ userId: phone })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.put.mock.calls.length).toBe(1);
    });

    it('should verify pin reset and return time lock delay', async () => {
      mockKeyserverApi.put.mockResolvedValue({
        status: 423,
        body: {
          message: 'Time locked until',
          delay: '2020-06-01T03:33:47.980Z',
        },
      });
      const delay = await KeyBackup.verifyPinReset({ userId: phone, code });
      expect(delay).toBeTruthy();
    });

    it('should verify pin reset and return null if time lock is over', async () => {
      mockKeyserverApi.put.mockResolvedValue({
        status: 304,
        body: { message: 'Invalid new pin' },
      });
      const delay = await KeyBackup.verifyPinReset({ userId: phone, code });
      expect(delay).toBe(null);
    });
  });

  describe('finalizePinReset', () => {
    beforeEach(async () => {
      await KeyBackup.createBackup({ data: {}, pin });
      await KeyBackup.registerPhone({ userId: phone, pin });
      await KeyBackup.verifyPhone({ userId: phone, code });
      await KeyBackup.initPinReset({ userId: phone });
    });

    it('should fail for invalid new pin', async () => {
      await expect(KeyBackup.finalizePinReset({ userId: phone, code, newPin: '' })).rejects.toThrow(/Invalid/);
      expect(mockKeyserverApi.put.mock.calls.length).toBe(1);
    });

    it('should call pin reset api in server with new pin', async () => {
      await KeyBackup.finalizePinReset({ userId: phone, code, newPin });
      expect(mockKeyserverApi.put.mock.calls.length).toBe(2);
    });
  });
});
