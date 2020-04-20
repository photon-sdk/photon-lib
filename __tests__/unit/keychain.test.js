import * as RNKeychain from 'react-native-keychain';
import * as keychain from '../../src/keychain';

describe('Keychain unit test', () => {
  beforeEach(() => {
    RNKeychain._nuke();
    RNKeychain.setInternetCredentials.mockClear();
    RNKeychain.getInternetCredentials.mockClear();
  });

  describe('setItem', () => {
    it('should fail on invalid args', async () => {
      await expect(keychain.setItem()).rejects.toThrow(/Invalid/);
    });

    it('should fail on api error', async () => {
      RNKeychain.setInternetCredentials.mockRejectedValueOnce(new Error('boom'));
      await expect(keychain.setItem('some-key', 'some-value')).rejects.toThrow('boom');
    });

    it('should store item and fetch correctly', async () => {
      await keychain.setItem('some-key', 'some-value');
      const val = await keychain.getItem('some-key');
      expect(val).toBe('some-value');
      expect(RNKeychain.setInternetCredentials).toHaveBeenCalledWith('0_some-key', 'photonlib', 'some-value', { accessible: 'wutdo' });
      expect(RNKeychain.getInternetCredentials).toHaveBeenCalledWith('0_some-key');
    });
  });

  describe('getItem', () => {
    it('should fail on invalid args', async () => {
      await expect(keychain.getItem()).rejects.toThrow(/Invalid/);
    });

    it('should fail on api error', async () => {
      RNKeychain.getInternetCredentials.mockRejectedValueOnce(new Error('boom'));
      await expect(keychain.getItem('some-key')).rejects.toThrow('boom');
    });

    it('should return null if not found', async () => {
      const val = await keychain.getItem('some-key');
      expect(val).toBe(null);
    });
  });
});
