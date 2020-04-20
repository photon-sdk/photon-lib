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

jest.mock('react-native-quick-actions', () => {
  return {
    clearShortcutItems: jest.fn(),
    setQuickActions: jest.fn(),
    isSupported: jest.fn(),
  };
});

jest.mock('react-native-default-preference', () => {
  return {
    setName: jest.fn(),
    set: jest.fn(),
  };
});
