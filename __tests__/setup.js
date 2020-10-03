import mockAsyncStorage from '@react-native-community/async-storage/jest/async-storage-mock';

jest.mock('@react-native-community/async-storage', () => mockAsyncStorage);

jest.mock('react-native-icloudstore', () => mockAsyncStorage);

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(selector => selector.ios),
}));

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

jest.mock('frisbee', () => {
  return jest.fn().mockImplementation(() => {
    return {
      auth: jest.fn(),
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
  });
});

jest.mock('react-native-google-drive-api-wrapper', () => {
  return {
    files: {
      safeCreateFolder: jest.fn(),
      createFileMultipart: jest.fn(),
      get: jest.fn(),
      getId: jest.fn(),
      delete: jest.fn(),
    },
  };
});
