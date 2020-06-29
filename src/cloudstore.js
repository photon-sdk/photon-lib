/**
 * @fileOverview cloud storage for iOS and Android. On iOS the iCloud key/value
 * store is used. Storage on Android relies on system backups to GDrive.
 */

import { Platform } from 'react-native';
import RNiCloudStorage from 'react-native-icloudstore';
import AsyncStorage from '@react-native-community/async-storage';
import { isPhone, isEmail, isId, isBuffer } from './verify';
const Store = Platform.OS === 'ios' ? RNiCloudStorage : AsyncStorage;

const VERSION = '1';
const ITEM_KEY = `${VERSION}_photon_key`;
const PHONE_KEY = `${VERSION}_photon_phone`;
const EMAIL_KEY = `${VERSION}_photon_email`;

//
// Encrypted key storage
//

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

//
// Phone number storage
//

export async function putPhone({ phone }) {
  if (!isPhone(phone)) {
    throw new Error('Invalid args');
  }
  if (await Store.getItem(PHONE_KEY)) {
    throw new Error('Phone already present');
  }
  await Store.setItem(PHONE_KEY, phone);
}

export async function getPhone() {
  return Store.getItem(PHONE_KEY);
}

export async function removePhone() {
  await Store.removeItem(PHONE_KEY);
}

//
// Email address storage
//

export async function putEmail({ email }) {
  if (!isEmail(email)) {
    throw new Error('Invalid args');
  }
  if (await Store.getItem(EMAIL_KEY)) {
    throw new Error('Email already present');
  }
  await Store.setItem(EMAIL_KEY, email);
}

export async function getEmail() {
  return Store.getItem(EMAIL_KEY);
}

export async function removeEmail() {
  await Store.removeItem(EMAIL_KEY);
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
