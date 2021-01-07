import GDrive from 'react-native-google-drive-api-wrapper';
import { GoogleSignin, statusCodes } from '@react-native-community/google-signin';

export async function authenticate(options = {}) {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    ...options,
  });
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });
  try {
    await GoogleSignin.signInSilently();
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_REQUIRED) {
      await GoogleSignin.signIn();
    }
  }
  const { accessToken } = await GoogleSignin.getTokens();
  GDrive.setAccessToken(accessToken);
  GDrive.init();
  if (!GDrive.isInitialized) {
    throw new Error('Unable to use GDrive');
  }
}

export async function setItem(keyId, value) {
  const content = Buffer.from(value).toString('base64');
  await GDrive.files.createFileMultipart(
    content,
    'text/plain',
    {
      parents: ['appDataFolder'],
      name: keyId,
    },
    true,
  );
}

export async function _getFileId(keyId) {
  const response = await GDrive.files.list({ spaces: 'appDataFolder', fields: 'nextPageToken, files(id, name)' });
  const json = await response.json();
  if (json.files.length === 0) {
    return null;
  }
  const file = json.files.find(file => file.name === keyId);
  return file ? file.id : null;
}

export async function getItem(keyId) {
  const fileId = await _getFileId(keyId);
  if (!fileId) {
    return null;
  }
  const response = await GDrive.files.get(fileId, { alt: 'media' });
  const key = await response.text();
  return key;
}

export async function removeItem(keyId) {
  const fileId = await _getFileId(keyId);
  if (!fileId) {
    return null;
  }
  await GDrive.files.delete(fileId);
}
