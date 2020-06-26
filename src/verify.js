/**
 * @fileOverview verification helpers to help sanitize input
 */

export function isPhone(o) {
  return /^\+[1-9]\d{1,14}$/.test(o);
}

export function isCode(o) {
  return /^\d{6}$/.test(o);
}

export function isId(o) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(o);
}

export function isPin(pin) {
  return pin ? /^.{4,256}$/.test(pin) : false;
}

export function isObject(o) {
  return Object.prototype.isPrototypeOf(o);
}

export function isString(o) {
  return typeof o === 'string' || String.prototype.isPrototypeOf(o);
}

export function isBuffer(o) {
  return Buffer.isBuffer(o);
}
