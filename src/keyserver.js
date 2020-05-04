/**
 * @fileOverview this module wraps http requests to the 2FA keyserver
 */

import Frisbee from 'frisbee';

export let _api; // the frisbee client instance (for testing)

/**
 * Initiate the client by setting the keyserver's base url.
 * @param  {string} baseURI  The keyserver base url
 * @return {undefined}
 */
export function init({ baseURI }) {
  _api = new Frisbee({
    baseURI,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create a new encryption key by registering a new user id. After this
 * request a verification sms will be sent to the provided phone number
 * to prove ownership.
 * @param  {string} phone     The user's phone number
 * @return {Promise<string>}  The encryption key id
 */
export async function createKey({ phone }) {
  const { status, body } = await _api.post(`/v1/key`, {
    body: { phone },
  });
  if (status !== 201) {
    throw new Error(`Keyserver error: ${body.message}`);
  }
  return body.id;
}

/**
 * Verify the creation of the new user with the verification code
 * which was sent via sms.
 * @param  {string} keyId     The encryption key id
 * @param  {string} phone     The user's phone number
 * @param  {string} code      The verification code sent via sms
 * @return {Promise<Buffer>}  The encryption key buffer
 */
export async function verifyCreate({ keyId, phone, code }) {
  return _verifyKey({ keyId, phone, code, op: 'verify' });
}

/**
 * Request encryption key download. After this request a verification sms
 * will be sent to the provided phone number to prove ownership.
 * @param  {string} keyId        The encryption key id
 * @param  {string} phone        The user's phone number
 * @return {Promise<undefined>}
 */
export async function fetchKey({ keyId, phone }) {
  const { status, body } = await _api.get(`/v1/key/${keyId}`, {
    params: { phone },
  });
  if (status !== 200) {
    throw new Error(`Keyserver error: ${body.message}`);
  }
}

/**
 * Verify the fetch request for the encryption key with the verification code
 * which was sent via sms.
 * @param  {string} keyId     The encryption key id
 * @param  {string} phone     The user's phone number
 * @param  {string} code      The verification code sent via sms
 * @return {Promise<Buffer>}  The encryption key buffer
 */
export async function verifyFetch({ keyId, phone, code }) {
  return _verifyKey({ keyId, phone, code, op: 'read' });
}

/**
 * Request encryption key and phone number removal. After this request a
 * verification sms will be sent to the provided phone number to prove ownership.
 * This should only be called if user's wallet backup is no longer required.
 * @param  {string} keyId        The encryption key id
 * @param  {string} phone        The user's phone number
 * @return {Promise<undefined>}
 */
export async function removeKey({ keyId, phone }) {
  const { status, body } = await _api.delete(`/v1/key/${keyId}`, {
    params: { phone },
  });
  if (status !== 200) {
    throw new Error(`Keyserver error: ${body.message}`);
  }
}

/**
 * Verify the removal request for the encryption key with the verification code
 * which was sent via sms. This will delete all data accociated with the user.
 * @param  {string} keyId     The encryption key id
 * @param  {string} phone     The user's phone number
 * @param  {string} code      The verification code sent via sms
 * @return {Promise<null>}  The encryption key buffer
 */
export async function verifyRemove({ keyId, phone, code }) {
  return _verifyKey({ keyId, phone, code, op: 'remove' });
}

async function _verifyKey({ keyId, phone, code, op }) {
  const { status, body } = await _api.put(`/v1/key/${keyId}`, {
    body: { phone, code, op },
  });
  if (status !== 200) {
    throw new Error(`Keyserver error: ${body.message}`);
  }
  const { encryptionKey } = body;
  return encryptionKey ? Buffer.from(encryptionKey, 'base64') : null;
}
