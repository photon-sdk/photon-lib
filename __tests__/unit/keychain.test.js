import * as RNKeychain from 'react-native-keychain';
import * as Keychain from '../../src/keychain';

describe('Keychain unit test', () => {
  beforeEach(() => {
    RNKeychain._nuke();
    RNKeychain.setInternetCredentials.mockClear();
    RNKeychain.getInternetCredentials.mockClear();
  });

  describe('setItem', () => {
    it('should fail on invalid args', async () => {
      await expect(Keychain.setItem('', 'some-value')).rejects.toThrow(/Invalid/);
    });

    it('should fail on invalid args', async () => {
      await expect(Keychain.setItem('some-key', {})).rejects.toThrow(/Invalid/);
    });

    it('should fail on api error', async () => {
      RNKeychain.setInternetCredentials.mockRejectedValueOnce(new Error('boom'));
      await expect(Keychain.setItem('some-key', 'some-value')).rejects.toThrow('boom');
    });

    it('should store item and fetch correctly', async () => {
      await Keychain.setItem('some-key', 'some-value');
      const val = await Keychain.getItem('some-key');
      expect(val).toBe('some-value');
      expect(RNKeychain.setInternetCredentials).toHaveBeenCalledWith('1_some-key', 'photon.user', 'some-value', { accessible: 'wutdo' });
      expect(RNKeychain.getInternetCredentials).toHaveBeenCalledWith('1_some-key');
    });
  });

  describe('getItem', () => {
    it('should fail on invalid args', async () => {
      await expect(Keychain.getItem('')).rejects.toThrow(/Invalid/);
    });

    it('should fail on api error', async () => {
      RNKeychain.getInternetCredentials.mockRejectedValueOnce(new Error('boom'));
      await expect(Keychain.getItem('some-key')).rejects.toThrow('boom');
    });

    it('should return null if not found', async () => {
      const val = await Keychain.getItem('some-key');
      expect(val).toBe(null);
    });
  });
});
