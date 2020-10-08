import GDrive from 'react-native-google-drive-api-wrapper';
import { GoogleSignin } from '@react-native-community/google-signin';

GoogleSignin.configure({
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.metadata',
  ],
});

const { accessToken } = GoogleSignin.getTokens();

GDrive.setAccessToken(accessToken);
GDrive.init();

if (!GDrive.isInitialized) {
  throw new Error('Unable to use G drive');
}

export async function setItem(keyId, value) {
  const folderId = await GDrive.files.safeCreateFolder({ name: 'Photon', parents: ['root'] });
  return GDrive.files.createFileMultipart(
    '',
    'text/plain',
    {
      parents: ['root', folderId],
      name: keyId,
      appProperties: {
        keyId: value,
      },
    },
    false,
  );
}

export async function getItem(keyId) {
  try {
    const fileId = await GDrive.files.getId(keyId, ['Photon'], 'text/plain', false);
    const meta = await GDrive.files.get(fileId);
    return JSON.stringify(meta.appProperties);
  } catch (e) {
    return new Error(e);
  }
}

export async function removeItem(keyId) {
  const fileId = await GDrive.files.getId(keyId, ['PhotonBackups'], 'text/plain', false);
  return GDrive.files.delete(fileId);
}
