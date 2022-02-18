import * as CloudStore from '../../src/cloudstore';
import * as GDriveCloudStorage from '../../src/GDriveCloudStorage';

describe('CloudStore android unit test', () => {
  const keyId = '8abe1a93-6a9c-490c-bbd5-d7f11a4a9c8f';
  const ciphertext = Buffer.from('encrypted stuff');

  describe('putKey', () => {
    it('fail on invalid args', async () => {
      const setItemSpy = jest.spyOn(GDriveCloudStorage, 'setItem');

      await expect(CloudStore.putKey({ keyId })).rejects.toThrow(/Invalid/);
      expect(setItemSpy.mock.calls.length).toBe(0);
    });

    it('store item', async () => {
      const getItemSpy = jest.spyOn(GDriveCloudStorage, 'getItem').mockImplementation();
      const setItemSpy = jest.spyOn(GDriveCloudStorage, 'setItem').mockImplementation();

      await CloudStore.putKey({ keyId, ciphertext });
      expect(setItemSpy.mock.calls[0][0]).toBe('1_photon_key_id');
      expect(setItemSpy.mock.calls[0][1]).toBe(keyId);
      expect(setItemSpy.mock.calls[1][0]).toBe('1_8abe1a93');
      expect(setItemSpy.mock.calls[1][1]).toMatch(/^{"keyId":.*"}$/);
      expect(setItemSpy.mock.calls.length).toBe(2);

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('should not backup twice', async () => {
      const getItemSpy = jest.spyOn(GDriveCloudStorage, 'getItem').mockResolvedValue('resolved value');
      const setItemSpy = jest.spyOn(GDriveCloudStorage, 'setItem').mockImplementation();

      await expect(CloudStore.putKey({ keyId, ciphertext })).rejects.toThrow(/already present/);
      expect(setItemSpy.mock.calls.length).toBe(0);
      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('getKey', () => {
    it('should not find item', async () => {
      const getItemSpy = jest.spyOn(GDriveCloudStorage, 'getItem').mockResolvedValue(null);

      const stored = await CloudStore.getKey();
      expect(stored).toBe(null);

      getItemSpy.mockRestore();
    });

    it('should get stored item by key Id', async () => {
      const result = {
        keyId: keyId,
        ciphertext: ciphertext,
        time: new Date(),
      };

      const getItemSpy = jest
        .spyOn(GDriveCloudStorage, 'getItem')
        .mockImplementation()
        .mockResolvedValueOnce(keyId)
        .mockResolvedValueOnce(JSON.stringify(result));

      const stored = await CloudStore.getKey();
      expect(stored).toEqual({
        keyId,
        ciphertext,
        time: expect.objectContaining(new Date()),
      });

      getItemSpy.mockRestore();
    });

    describe('removeKeyId', () => {
      it('fail on invalid args', async () => {
        const result = {
          keyId: keyId,
          ciphertext: ciphertext,
          time: new Date(),
        };

        const removeItemSpy = jest.spyOn(GDriveCloudStorage, 'removeItem');
        const getItemSpy = jest.spyOn(GDriveCloudStorage, 'getItem').mockResolvedValueOnce(keyId).mockResolvedValue(JSON.stringify(result));
        const getKeySpy = jest.spyOn(CloudStore, 'getKey').mockResolvedValue(result);

        await expect(CloudStore.removeKeyId({ keyId: 'invalid' })).rejects.toThrow(/not found/);
        expect(getItemSpy.mock.calls.length).toBe(2);

        getItemSpy.mockRestore();
        removeItemSpy.mockRestore();
        getKeySpy.mockRestore();
      });
    });
  });
});
