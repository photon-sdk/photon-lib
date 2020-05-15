/**
 * @fileOverview a high level backup module that provides apis for key backup
 * and restore. Encryption and key storage in the device keychain is handled
 * transparently and does not need to be done by th api consumer explicitly.
 */

import * as chacha from './chacha';
import * as Keychain from './keychain';
import * as KeyServer from './keyserver';
import * as CloudStore from './cloudstore';
import { isPhone, isId, isCode, isObject } from './verify';

export const KEY_ID = 'photon.keyId';

/**
 * Initialize the key backup module by specifying the key server which is
 * used to store the encryption key to the cloud backup.
 * @param  {string} keyServerURI  The base url of the key server
 * @return {undefined}
 */
export function init({ keyServerURI }) {
  KeyServer.init({ baseURI: keyServerURI });
}

/**
 * Check for an existing backup in cloud storage. There are two possible
 * workflows:
 *
 * Workflow A: If no backup exists, a new user should be registerd.
 *
 * Workflow B: If a backup for the phone number exists, the user has already
 * registered on another device and this device should initiate restore.
 *
 * @param  {string}  phone     The user's phone number
 * @return {Promise<boolean>}  If a backup exists
 */
export async function checkForExistingBackup({ phone }) {
  if (!isPhone(phone)) {
    throw new Error('Invalid args');
  }
  const backup = await CloudStore.get({ phone });
  if (backup && isId(backup.keyId)) {
    await Keychain.setItem(KEY_ID, backup.keyId);
  }
  return !!backup;
}

//
// Workflow A
//

/**
 * Register a new user. This generates a new encryption key in the keyserver.
 * @param  {string} phone        The user's phone number
 * @return {Promise<undefined>}
 */
export async function registerNewUser({ phone }) {
  if (!isPhone(phone)) {
    throw new Error('Invalid args');
  }
  const keyId = await KeyServer.createKey({ phone });
  await Keychain.setItem(KEY_ID, keyId);
}

/**
 * Verifiy a new user using a verification code (sent via SMS).
 * @param  {string} phone  The user's phone number
 * @param  {string} code   The verification code sent via SMS
 * @return {Promise<undefined>}
 */
export async function verifyNewUser({ phone, code }) {
  if (!isPhone(phone) || !isCode(code)) {
    throw new Error('Invalid args');
  }
  const keyId = await fetchKeyId();
  const encryptionKey = await KeyServer.verifyCreate({ keyId, phone, code });
  await Keychain.setItem(keyId, stringifyKey({ phone, encryptionKey }));
}

/**
 * Create an encrypted backup of an object on cloud storage. This should be
 * called after a new has been registered and verified.
 * @param  {Object} object       The data to be backed up
 * @return {Promise<undefined>}
 */
export async function createBackup(object) {
  if (!isObject(object)) {
    throw new Error('Invalid args');
  }
  const plaintext = Buffer.from(JSON.stringify(object), 'utf8');
  const { keyId, phone, encryptionKey } = await fetchEncryptionKey();
  const ciphertext = await chacha.encrypt(plaintext, encryptionKey);
  await CloudStore.put({ keyId, phone, ciphertext });
}

//
// Workflow B
//

/**
 * Register a new device. This is first step to restore a backup on a new
 * device e.g. in case the first device was lost or stolen. A user could also
 * chose to restore their wallet on another device for redunancy.
 * @param  {string} phone        The user's phone number
 * @return {Promise<undefined>}
 */
export async function registerDevice({ phone }) {
  if (!isPhone(phone)) {
    throw new Error('Invalid args');
  }
  const keyId = await fetchKeyId();
  await KeyServer.fetchKey({ keyId, phone });
}

/**
 * Verify phone number ownership for the new device by providing a verification
 * code which is sent via SMS
 * @param  {string} phone        The user's phone number
 * @param  {string} code         The verification code sent via SMS
 * @return {Promise<undefined>}
 */
export async function verifyDevice({ phone, code }) {
  if (!isPhone(phone) || !isCode(code)) {
    throw new Error('Invalid args');
  }
  const keyId = await fetchKeyId();
  const encryptionKey = await KeyServer.verifyFetch({ keyId, phone, code });
  await Keychain.setItem(keyId, stringifyKey({ phone, encryptionKey }));
}

/**
 * Restore a backed up encrypted object from cloud storage.
 * @return {Promise<Object>}  The restored object
 */
export async function restoreBackup() {
  const { keyId, phone, encryptionKey } = await fetchEncryptionKey();
  const backup = await CloudStore.get({ phone });
  if (!backup || backup.keyId !== keyId) {
    return null;
  }
  const { ciphertext } = backup;
  const plaintext = await chacha.decrypt(ciphertext, encryptionKey);
  return JSON.parse(plaintext.toString('utf8'));
}

//
// Helper functions
//

async function fetchKeyId() {
  const keyId = await Keychain.getItem(KEY_ID);
  if (!keyId) {
    throw new Error('No key id found. Call checkForExistingBackup() first.');
  }
  return keyId;
}

async function fetchEncryptionKey() {
  const keyId = await fetchKeyId();
  const key = parseKey(await Keychain.getItem(keyId));
  if (!key) {
    throw new Error('No encryption key in keychain. Call registerNewUser() or registerDevice() first.');
  }
  return { keyId, ...key };
}

function stringifyKey({ phone, encryptionKey }) {
  return JSON.stringify({
    phone,
    encryptionKey: encryptionKey.toString('base64'),
  });
}

function parseKey(item) {
  if (!item) {
    return null;
  }
  const { phone, encryptionKey } = JSON.parse(item);
  return {
    phone,
    encryptionKey: Buffer.from(encryptionKey, 'base64'),
  };
}
