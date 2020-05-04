import * as KeyServer from '../../src/keyserver';

describe('Keychain unit test', () => {
  const keyId = 'some-id';
  const phone = '+4917512345678';
  const code = '000000';
  let api;

  beforeEach(() => {
    KeyServer.init({ baseURI: 'http://localhost:8000' });
    api = KeyServer._api;
  });

  describe('createKey', () => {
    it('should fail on api error', async () => {
      api.post.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.createKey({ phone })).rejects.toThrow(/boom/);
    });

    it('should return key id on success', async () => {
      api.post.mockResolvedValue({
        status: 201,
        body: { id: 'some-id' },
      });
      const resKeyId = await KeyServer.createKey({ phone });
      expect(resKeyId).toBe('some-id');
      expect(api.post.mock.calls[0][0]).toBe('/v1/key');
      expect(api.post.mock.calls[0][1]).toEqual({ body: { phone } });
    });
  });

  describe('verifyCreate', () => {
    it('should fail on api error', async () => {
      api.put.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.verifyCreate({ keyId, phone, code })).rejects.toThrow(/boom/);
    });

    it('should return encryption key on success', async () => {
      api.put.mockResolvedValue({
        status: 200,
        body: {
          id: 'some-id',
          encryptionKey: Buffer.from('some-key').toString('base64'),
        },
      });
      const keyBuf = await KeyServer.verifyCreate({ keyId, phone, code });
      expect(keyBuf.toString()).toBe('some-key');
      expect(api.put.mock.calls[0][0]).toBe('/v1/key/some-id');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { phone, code, op: 'verify' } });
    });
  });

  describe('fetchKey', () => {
    it('should fail on api error', async () => {
      api.get.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.fetchKey({ keyId, phone })).rejects.toThrow(/boom/);
    });

    it('should return 200 on success', async () => {
      api.get.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      await KeyServer.fetchKey({ keyId, phone });
      expect(api.get.mock.calls[0][0]).toBe('/v1/key/some-id');
      expect(api.get.mock.calls[0][1]).toEqual({ params: { phone } });
    });
  });

  describe('verifyFetch', () => {
    it('should fail on api error', async () => {
      api.put.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.verifyFetch({ keyId, phone, code })).rejects.toThrow(/boom/);
    });

    it('should return encryption key on success', async () => {
      api.put.mockResolvedValue({
        status: 200,
        body: {
          id: 'some-id',
          encryptionKey: Buffer.from('some-key').toString('base64'),
        },
      });
      const keyBuf = await KeyServer.verifyFetch({ keyId, phone, code });
      expect(keyBuf.toString()).toBe('some-key');
      expect(api.put.mock.calls[0][0]).toBe('/v1/key/some-id');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { phone, code, op: 'read' } });
    });
  });

  describe('removeKey', () => {
    it('should fail on api error', async () => {
      api.delete.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.removeKey({ keyId, phone })).rejects.toThrow(/boom/);
    });

    it('should return 200 on success', async () => {
      api.delete.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      await KeyServer.removeKey({ keyId, phone });
      expect(api.delete.mock.calls[0][0]).toBe('/v1/key/some-id');
      expect(api.delete.mock.calls[0][1]).toEqual({ params: { phone } });
    });
  });

  describe('verifyRemove', () => {
    it('should fail on api error', async () => {
      api.put.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.verifyRemove({ keyId, phone, code })).rejects.toThrow(/boom/);
    });

    it('should return 200 on success', async () => {
      api.put.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      const response = await KeyServer.verifyRemove({ keyId, phone, code });
      expect(response).toBe(null);
      expect(api.put.mock.calls[0][0]).toBe('/v1/key/some-id');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { phone, code, op: 'remove' } });
    });
  });
});
