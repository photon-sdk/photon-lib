import { KeyBackup } from '../../';
import * as _Keychain from '../../src/keychain';
import * as _CloudStore from '../../src/cloudstore';
import * as mockRNKeychain from 'react-native-keychain';
import { _api as mockKeyserverApi } from '../../src/keyserver';
import mockCloudStorage from '@react-native-community/async-storage';

describe('KeyBackup unit test', () => {
  const keyId = '8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f';
  const phone = '+4917512345678';
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
    mockKeyserverApi.put.mockResolvedValue({
      status: 200,
      body: {
        id: keyId,
        encryptionKey: encryptionKeyBase64,
      },
    });
    mockKeyserverApi.get.mockResolvedValue({
      status: 200,
      body: { message: 'Success' },
    });
  });

  describe('checkForExistingBackup', () => {
    it('should fail on invalid args', async () => {
      await expect(KeyBackup.checkForExistingBackup({})).rejects.toThrow(/Invalid/);
    });

    it('should not find backup', async () => {
      const exists = await KeyBackup.checkForExistingBackup({ phone });
      expect(exists).toBe(false);
    });

    it('should set key id if exisiting item exists', async () => {
      await _CloudStore.put({ keyId, phone, ciphertext });
      const exists = await KeyBackup.checkForExistingBackup({ phone });
      expect(exists).toBe(true);
      expect(await _Keychain.getItem(KeyBackup.KEY_ID)).toBe(keyId);
    });

    it('should not find backup for wrong phone number', async () => {
      await _CloudStore.put({ keyId, phone: '+4917512345679', ciphertext });
      const exists = await KeyBackup.checkForExistingBackup({ phone });
      expect(exists).toBe(false);
      expect(await _Keychain.getItem(KeyBackup.KEY_ID)).toBe(null);
    });
  });

  describe('registerNewUser', () => {
    it('should fail on invalid args', async () => {
      await expect(KeyBackup.registerNewUser({})).rejects.toThrow(/Invalid/);
    });

    it('should create key in key server and store key id', async () => {
      await KeyBackup.registerNewUser({ phone });
      expect(await _Keychain.getItem(KeyBackup.KEY_ID)).toBe(keyId);
    });
  });

  describe('verifyNewUser', () => {
    beforeEach(async () => {
      await KeyBackup.registerNewUser({ phone });
    });

    it('should fail on invalid args', async () => {
      await expect(KeyBackup.verifyNewUser({})).rejects.toThrow(/Invalid/);
    });

    it('should verify', async () => {
      await KeyBackup.verifyNewUser({ phone, code });
      expect(await _Keychain.getItem(keyId)).toBeDefined();
    });
  });

  describe('createBackup', () => {
    beforeEach(async () => {
      expect(await KeyBackup.checkForExistingBackup({ phone })).toBe(false);
      await KeyBackup.registerNewUser({ phone });
      await KeyBackup.verifyNewUser({ phone, code });
    });

    it('should fail on invalid args', async () => {
      await expect(KeyBackup.createBackup('')).rejects.toThrow(/Invalid/);
    });

    it('should encrpt and store object', async () => {
      await KeyBackup.createBackup({ foo: 'bar' });
      expect(await KeyBackup.checkForExistingBackup({ phone })).toBe(true);
    });
  });

  describe('registerDevice', () => {
    beforeEach(async () => {
      await KeyBackup.registerNewUser({ phone });
      await KeyBackup.verifyNewUser({ phone, code });
      await KeyBackup.createBackup({ foo: 'bar' });
      mockRNKeychain._nuke(); // simulate new unsynced device
    });

    it('should fail on invalid args', async () => {
      await expect(KeyBackup.registerDevice({})).rejects.toThrow(/Invalid/);
    });

    it('should fail if not checked for backup yet', async () => {
      await expect(KeyBackup.registerDevice({ phone })).rejects.toThrow(/checkForExistingBackup()/);
    });

    it('should request key from key server', async () => {
      expect(await KeyBackup.checkForExistingBackup({ phone })).toBe(true);
      await KeyBackup.registerDevice({ phone });
      expect(mockKeyserverApi.get.mock.calls.length).toBe(1);
    });
  });

  describe('verifyDevice', () => {
    beforeEach(async () => {
      await KeyBackup.registerNewUser({ phone });
      await KeyBackup.verifyNewUser({ phone, code });
      await KeyBackup.createBackup({ foo: 'bar' });
      mockRNKeychain._nuke(); // simulate new unsynced device
      expect(await KeyBackup.checkForExistingBackup({ phone })).toBe(true);
      await KeyBackup.registerDevice({ phone });
    });

    it('should fail on invalid args', async () => {
      await expect(KeyBackup.verifyDevice({})).rejects.toThrow(/Invalid/);
    });

    it('should download encryption key', async () => {
      await KeyBackup.verifyDevice({ phone, code });
      expect(await _Keychain.getItem(keyId)).toBeDefined();
    });
  });

  describe('restoreBackup', () => {
    beforeEach(async () => {
      await KeyBackup.registerNewUser({ phone });
      await KeyBackup.verifyNewUser({ phone, code });
      await KeyBackup.createBackup({ foo: 'bar' });
      mockRNKeychain._nuke(); // simulate new unsynced device
      expect(await KeyBackup.checkForExistingBackup({ phone })).toBe(true);
      await KeyBackup.registerDevice({ phone });
      await KeyBackup.verifyDevice({ phone, code });
    });

    it('should download and decrypt backup', async () => {
      const backup = await KeyBackup.restoreBackup();
      expect(backup.foo).toBe('bar');
    });

    it('should return null if no backup found', async () => {
      mockCloudStorage.clear();
      const backup = await KeyBackup.restoreBackup();
      expect(backup).toBe(null);
    });
  });
});
