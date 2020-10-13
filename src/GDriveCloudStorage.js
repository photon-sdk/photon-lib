import GDrive from 'react-native-google-drive-api-wrapper';
import { GoogleSignin } from '@react-native-community/google-signin';

async function authenticate() {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  });
  const { accessToken } = await GoogleSignin.getTokens();
  GDrive.setAccessToken(accessToken);
  GDrive.init();
  if (!GDrive.isInitialized) {
    throw new Error('Unable to use G drive');
  }
}

export async function setItem(keyId, value) {
  await initialGoogle();
  return GDrive.files.createFileMultipart(
    '',
    'text/plain',
    {
      parents: ['appDataFolder'],
      name: keyId,
      appProperties: {
        keyId: value,
      },
    },
    false,
  );
}

export async function getItem(keyId) {
  await initialGoogle();
  const fileId = await GDrive.files.getId(keyId, ['appDataFolder'], 'text/plain', false);
  const meta = await GDrive.files.get(fileId);
  return JSON.stringify(meta.appProperties);
}

export async function removeItem(keyId) {
  await initialGoogle();
  const fileId = await GDrive.files.getId(keyId, ['appDataFolder'], 'text/plain', false);
  return GDrive.files.delete(fileId);
}
