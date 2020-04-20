/**
 * @fileOverview a module to wrap native secure key store apis
 */

import * as RNKeychain from 'react-native-keychain';

const VERSION = '0';
const USER = 'photonlib';

/**
 * Store an item in the keychain.
 * @param {string} key   The key by which to do a lookup
 * @param {string} value The value to be stored
 * @return {Promise<undefined>}
 */
export async function setItem(key, value) {
  if (!key || typeof value === 'undefined') {
    throw new Error('Invalid args');
  }
  const options = {
    accessible: RNKeychain.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
  const vKey = `${VERSION}_${key}`;
  await RNKeychain.setInternetCredentials(vKey, USER, value, options);
}

/**
 * Read an item stored in the keychain.
 * @param  {string} key      The key by which to do a lookup.
 * @return {Promise<string>} The stored value
 */
export async function getItem(key) {
  if (!key) {
    throw new Error('Invalid args');
  }
  const vKey = `${VERSION}_${key}`;
  const credentials = await RNKeychain.getInternetCredentials(vKey);
  if (credentials) {
    return credentials.password;
  } else {
    return null;
  }
}
