import GDrive from 'react-native-google-drive-api-wrapper';
import { GoogleSignin } from '@react-native-community/google-signin';

export async function authenticate(options = {}) {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    ...options,
  });
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });
  await GoogleSignin.signIn();
  const { accessToken } = await GoogleSignin.getTokens();
  GDrive.setAccessToken(accessToken);
  GDrive.init();
  if (!GDrive.isInitialized) {
    throw new Error('Unable to use GDrive');
  }
}

export async function setItem(keyId, value) {
  return GDrive.files.createFileMultipart(
    '',
    'text/plain',
    {
      parents: ['appDataFolder'],
      name: keyId,
      appProperties: { value },
    },
    false,
  );
}

async function _getFileId(keyId) {
  return GDrive.files.getId(keyId, ['appDataFolder'], 'text/plain', false);
}

export async function getItem(keyId) {
  const fileId = await _getFileId(keyId);
  if (!fileId) {
    return null;
  }
  const meta = await GDrive.files.get(fileId);
  return meta ? meta.appProperties.value : null;
}

export async function removeItem(keyId) {
  const fileId = await _getFileId(keyId);
  if (!fileId) {
    throw new Error('Item not found');
  }
  return GDrive.files.delete(fileId);
}
