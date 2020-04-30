import crypto from 'crypto';
import { promisify } from 'util';
import mockAsyncStorage from '@react-native-community/async-storage/jest/async-storage-mock';

jest.mock('@react-native-community/async-storage', () => mockAsyncStorage);

jest.mock('react-native-keychain', () => {
  let IN_MEMORY_STORE = {};
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'wutdo',
    setInternetCredentials: jest.fn(async (key, user, value) => {
      IN_MEMORY_STORE[key] = value;
    }),
    getInternetCredentials: jest.fn(async key => {
      return IN_MEMORY_STORE[key] && { password: IN_MEMORY_STORE[key] };
    }),
    _nuke: () => {
      IN_MEMORY_STORE = {};
    },
  };
});

jest.mock('../src/random', () => {
  return {
    randomBytes: jest.fn(size => promisify(crypto.randomBytes)(size)),
  };
});
