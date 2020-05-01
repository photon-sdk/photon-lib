/**
 * @fileOverview cloud storage for iOS and Android. On iOS the iCloud key/value
 * store is used. Storage on Android relies on system backups to GDrive.
 */

import { Platform } from 'react-native';
import RNiCloudStorage from 'react-native-icloudstore';
import AsyncStorage from '@react-native-community/async-storage';
import { isPhone, isId, isBuffer } from './verify';

const Store = Platform.OS === 'ios' ? RNiCloudStorage : AsyncStorage;
const VERSION = '0';

/**
 * Store an item for backup. The item should already contain the encrypted
 * ciphertext.
 * @param  {string} keyId       The encryption key id
 * @param  {string} phone       The user's phone number
 * @param  {Buffer} ciphertext  The encrypted data
 * @return {Promise<undefined>}
 */
export async function put({ keyId, phone, ciphertext }) {
  if (!isId(keyId) || !isPhone(phone) || !isBuffer(ciphertext)) {
    throw new Error('Invalid args');
  }
  const vKeyId = `${VERSION}_${keyId}`;
  if (await Store.getItem(vKeyId)) {
    throw new Error('Backup already present');
  }
  await Store.setItem(vKeyId, stringify({ keyId, phone, ciphertext }));
}

/**
 * Fetch a backup from cloud storage
 * @param  {string} phone  The user's phone number
 * @return {Object}        The stored object
 */
export async function get({ phone }) {
  if (!isPhone(phone)) {
    throw new Error('Invalid args');
  }
  const itemKeys = await Store.getAllKeys();
  const results = await Promise.all(
    itemKeys.map(async vKeyId => {
      const item = parse(await Store.getItem(vKeyId));
      return item && item.phone === phone ? item : null;
    }),
  );
  return results.find(r => r) || null;
}

/**
 * Delete a backup from cloud storage.
 * @param  {string} keyId  The encryption key id
 * @return {Object}        The stored object
 */
export async function remove({ keyId }) {
  if (!isId(keyId)) {
    throw new Error('Invalid args');
  }
  const vKeyId = `${VERSION}_${keyId}`;
  await Store.removeItem(vKeyId);
}

//
// Helper functions
//

function stringify({ keyId, phone, ciphertext }) {
  return JSON.stringify({
    keyId,
    phone,
    ciphertext: ciphertext.toString('base64'),
    time: new Date().toISOString(),
  });
}

function parse(item) {
  if (!item) {
    return null;
  }
  const { keyId, phone, ciphertext, time } = JSON.parse(item);
  return {
    keyId,
    phone,
    ciphertext: Buffer.from(ciphertext, 'base64'),
    time: new Date(time),
  };
}
