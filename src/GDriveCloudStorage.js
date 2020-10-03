import GDrive from 'react-native-google-drive-api-wrapper';

const GDriveCloudStorage = {
  async setItem(keyId, value) {
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
  },

  async getItem(keyId) {
    return new Promise((resolve, reject) => {
      GDrive.files.getId(keyId, ['Photon'], 'text/plain', false).then(fileId => {
        GDrive.files
          .get(fileId)
          .then(meta => resolve(JSON.stringify(meta.appProperties)))
          .catch(e => reject(e));
      });
    });
  },

  async removeItem(keyId) {
    const fileId = await GDrive.files.getId(keyId, ['PhotonBackups'], 'text/plain', false);
    return GDrive.files.delete(fileId);
  },
};

export default GDriveCloudStorage;
