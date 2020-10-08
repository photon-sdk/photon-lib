import * as ReactNative from 'react-native';

export const Platform = {
  ...ReactNative.Platform,
  OS: 'ios', // change to android for Platform specfic tests
  Version: 123,
  isTesting: true,
  select: objs => objs['ios'],
};

export default Object.setPrototypeOf(
  {
    Platform,
  },
  ReactNative,
);
