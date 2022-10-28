/**
 * @fileOverview cloud storage for iOS and Android. On iOS the iCloud key/value
 * store is used. Storage on Android relies on system backups to GDrive.
 */

import { Platform, NativeEventEmitter } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNiCloudStorage from '@photon-sdk/react-native-icloudstore';
import * as GDriveCloudStorage from './GDriveCloudStorage';
import { isPhone, isEmail, isId, isBuffer, isTimestamp } from './verify';

const Store = Platform.OS === 'ios' ? RNiCloudStorage : GDriveCloudStorage;

const VERSION = '1';
const KEY_ID = `${VERSION}_photon_key_id`;
const PHONE = `${VERSION}_photon_phone`;
const EMAIL = `${VERSION}_photon_email`;
const DEVICE_ID = `${VERSION}_photon_device_id`;
const KEY_ID_CHANNELS = `${VERSION}_photon_key_id_channels`;

export function init({ onOtherDeviceLogin }) {
  const eventEmitter = new NativeEventEmitter(RNiCloudStorage);
  eventEmitter.addListener('iCloudStoreDidChangeRemotely', ({ changedKeys }) => {
    if (changedKeys !== null && changedKeys.includes(DEVICE_ID)) {
      onOtherDeviceLogin();
    }
  });
}

export async function authenticate(options) {
  if (Store.authenticate) {
    await Store.authenticate(options);
  }
}

//
// Encrypted lightning channel storage
//

export async function putChannels({ keyId, ciphertext, timestamp }) {
  if (!isId(keyId) || !isBuffer(ciphertext) || !isTimestamp(timestamp)) {
    throw new Error('Invalid args');
  }
  await _lockChannels();
  await _checkDeviceId();
  const channels = await _fetchChannels(keyId);
  if (channels && channels.time.getTime() > timestamp) {
    throw new Error('Newer channel backup already present');
  }
  await Store.setItem(KEY_ID_CHANNELS, keyId);
  await Store.setItem(shortKeyId(keyId), stringify({ keyId, ciphertext, timestamp }));
  _unlockChannels();
}

export async function getChannels() {
  await _lockChannels();
  await _checkDeviceId();
  const channels = await _fetchChannels();
  _unlockChannels();
  return channels;
}

export async function allowOtherDevice() {
  await _lockChannels();
  await Store.removeItem(DEVICE_ID);
  _unlockChannels();
}

async function _fetchChannels(customKeyId) {
  const keyId = await Store.getItem(KEY_ID_CHANNELS);
  if (!keyId) {
    return null;
  }
  if (customKeyId && customKeyId !== keyId) {
    throw new Error('Another key backup already present');
  }
  const channels = await Store.getItem(shortKeyId(keyId));
  return channels ? parse(channels) : null;
}

let _channelMutex = false;

async function _lockChannels() {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (_channelMutex) {
    await nap();
  }
  _channelMutex = true;
}

function _unlockChannels() {
  _channelMutex = false;
}

async function _checkDeviceId() {
  const deviceId = await DeviceInfo.getUniqueId();
  const storedId = await Store.getItem(DEVICE_ID);
  if (storedId && storedId !== deviceId) {
    throw new Error('Another device is storing channel state');
  }
  if (!storedId) {
    await Store.setItem(DEVICE_ID, deviceId);
  }
}

//
// Encrypted key storage
//

export async function putKey({ keyId, ciphertext }) {
  if (!isId(keyId) || !isBuffer(ciphertext)) {
    throw new Error('Invalid args');
  }
  if (await Store.getItem(KEY_ID)) {
    throw new Error('Backup already present');
  }
  await Store.setItem(KEY_ID, keyId);
  await Store.setItem(shortKeyId(keyId), stringify({ keyId, ciphertext }));
}

export async function getKey() {
  const keyId = await Store.getItem(KEY_ID);
  if (!keyId) {
    return null;
  }
  const key = await Store.getItem(shortKeyId(keyId));
  return key ? parse(key) : null;
}

export async function removeKeyId({ keyId }) {
  const item = await getKey();
  if (!item || item.keyId !== keyId) {
    throw new Error('Backup not found');
  }
  await Store.removeItem(KEY_ID);
}

//
// Phone number storage
//

export async function putPhone({ userId }) {
  if (!isPhone(userId)) {
    throw new Error('Invalid args');
  }
  await Store.setItem(PHONE, userId);
}

export async function getPhone() {
  return Store.getItem(PHONE);
}

export async function removePhone() {
  await Store.removeItem(PHONE);
}

//
// Email address storage
//

export async function putEmail({ userId }) {
  if (!isEmail(userId)) {
    throw new Error('Invalid args');
  }
  await Store.setItem(EMAIL, userId);
}

export async function getEmail() {
  return Store.getItem(EMAIL);
}

export async function removeEmail() {
  await Store.removeItem(EMAIL);
}

//
// Helper functions
//

function shortKeyId(keyId) {
  const shortId = keyId.replace(/-/g, '').slice(0, 8);
  return `${VERSION}_${shortId}`;
}

function stringify({ keyId, ciphertext, timestamp }) {
  return JSON.stringify({
    keyId,
    ciphertext: ciphertext.toString('base64'),
    time: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
  });
}

function parse(item) {
  const { keyId, ciphertext, time } = JSON.parse(item);
  return {
    keyId,
    ciphertext: Buffer.from(ciphertext, 'base64'),
    time: new Date(time),
  };
}

function nap(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
