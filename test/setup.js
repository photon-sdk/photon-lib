jest.mock('react-native-secure-key-store', () => {
  return {
    setResetOnAppUninstallTo: jest.fn(),
  };
});

jest.mock('react-native-quick-actions', () => {
  return {
    clearShortcutItems: jest.fn(),
    setQuickActions: jest.fn(),
    isSupported: jest.fn(),
  };
});
