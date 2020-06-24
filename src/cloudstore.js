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
const ITEM_KEY = `${VERSION}_photon_key`;
const USER_KEY = `${VERSION}_photon_uid`;

export async function putKey({ keyId, ciphertext }) {
  if (!isId(keyId) || !isBuffer(ciphertext)) {
    throw new Error('Invalid args');
  }
  if (await Store.getItem(ITEM_KEY)) {
    throw new Error('Backup already present');
  }
  await Store.setItem(ITEM_KEY, stringifyKey({ keyId, ciphertext }));
}

export async function getKey() {
  const item = await Store.getItem(ITEM_KEY);
  return item ? parseKey(item) : null;
}

export async function removeKey({ keyId }) {
  const item = await getKey();
  if (!item || item.keyId !== keyId) {
    throw new Error('Backup not found');
  }
  await Store.removeItem(ITEM_KEY);
}

export async function putUser({ keyId, userId }) {
  if (!isId(keyId) || !isPhone(userId)) {
    throw new Error('Invalid args');
  }
  if (await Store.getItem(USER_KEY)) {
    throw new Error('User already present');
  }
  await Store.setItem(USER_KEY, JSON.stringify({ keyId, userId }));
}

export async function getUser() {
  const item = await Store.getItem(USER_KEY);
  return item ? JSON.parse(item) : null;
}

export async function removeUser({ keyId }) {
  const item = await getUser();
  if (!item || item.keyId !== keyId) {
    throw new Error('User not found');
  }
  await Store.removeItem(USER_KEY);
}

//
// Helper functions
//

function stringifyKey({ keyId, ciphertext }) {
  return JSON.stringify({
    keyId,
    ciphertext: ciphertext.toString('base64'),
    time: new Date().toISOString(),
  });
}

function parseKey(item) {
  const { keyId, ciphertext, time } = JSON.parse(item);
  return {
    keyId,
    ciphertext: Buffer.from(ciphertext, 'base64'),
    time: new Date(time),
  };
}
