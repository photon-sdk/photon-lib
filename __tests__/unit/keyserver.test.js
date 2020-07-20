import * as KeyServer from '../../src/keyserver';

describe('KeyServer unit test', () => {
  const keyId = 'some-id';
  const userId = '+4917512345678';
  const code = '000000';
  const pin = '1234';
  const newPin = '5678';
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
      await expect(KeyServer.createKey({ pin })).rejects.toThrow(/boom/);
    });

    it('should return key id on success', async () => {
      api.post.mockResolvedValue({
        status: 201,
        body: { id: 'some-id' },
      });
      const resKeyId = await KeyServer.createKey({ pin });
      expect(resKeyId).toBe('some-id');
      expect(api.post.mock.calls[0]).toEqual(['/v2/key', { body: { pin } }]);
      expect(api.auth.mock.calls[0]).toEqual(['', pin]);
    });
  });

  describe('fetchKey', () => {
    it('should fail on api error', async () => {
      api.get.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.fetchKey({ keyId })).rejects.toThrow(/boom/);
    });

    it('should throw delay error on rate limit', async () => {
      api.get.mockResolvedValue({
        status: 429,
        body: {
          message: 'Time locked until',
          delay: '2020-06-01T03:33:47.980Z',
        },
      });
      await expect(KeyServer.fetchKey({ keyId })).rejects.toThrow(KeyServer.RateLimitError);
    });

    it('should return encryption key on success', async () => {
      api.get.mockResolvedValue({
        status: 200,
        body: {
          id: 'some-id',
          encryptionKey: Buffer.from('some-key').toString('base64'),
        },
      });
      const keyBuf = await KeyServer.fetchKey({ keyId });
      expect(keyBuf.toString()).toBe('some-key');
      expect(api.get.mock.calls[0][0]).toBe('/v2/key/some-id');
    });
  });

  describe('changePin', () => {
    it('should fail on api error', async () => {
      api.put.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.changePin({ keyId, newPin })).rejects.toThrow(/boom/);
    });

    it('should throw delay error on rate limit', async () => {
      api.put.mockResolvedValue({
        status: 429,
        body: {
          message: 'Time locked until',
          delay: '2020-06-01T03:33:47.980Z',
        },
      });
      await expect(KeyServer.changePin({ keyId, newPin })).rejects.toThrow(KeyServer.RateLimitError);
    });

    it('should set new pin on success', async () => {
      api.put.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      await KeyServer.changePin({ keyId, newPin });
      expect(api.put.mock.calls[0][0]).toBe('/v2/key/some-id');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { newPin } });
      expect(api.auth.mock.calls[0]).toEqual(['', '5678']);
    });
  });

  describe('createUser', () => {
    it('should fail on api error', async () => {
      api.post.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.createUser({ keyId, userId })).rejects.toThrow(/boom/);
    });

    it('should throw delay error on rate limit', async () => {
      api.post.mockResolvedValue({
        status: 429,
        body: {
          message: 'Time locked until',
          delay: '2020-06-01T03:33:47.980Z',
        },
      });
      await expect(KeyServer.createUser({ keyId, userId })).rejects.toThrow(KeyServer.RateLimitError);
    });

    it('should return 201 on success', async () => {
      api.post.mockResolvedValue({
        status: 201,
        body: { message: 'Success' },
      });
      await KeyServer.createUser({ keyId, userId });
      expect(api.post.mock.calls[0][0]).toBe('/v2/key/some-id/user');
      expect(api.post.mock.calls[0][1]).toEqual({ body: { userId } });
    });
  });

  describe('verifyUser', () => {
    it('should fail on api error', async () => {
      api.put.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.verifyUser({ keyId, userId, code })).rejects.toThrow(/boom/);
    });

    it('should throw delay error on rate limit', async () => {
      api.put.mockResolvedValue({
        status: 429,
        body: {
          message: 'Time locked until',
          delay: '2020-06-01T03:33:47.980Z',
        },
      });
      await expect(KeyServer.verifyUser({ keyId, userId })).rejects.toThrow(KeyServer.RateLimitError);
    });

    it('should return 200 on success', async () => {
      api.put.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      await KeyServer.verifyUser({ keyId, userId, code });
      expect(api.put.mock.calls[0][0]).toBe('/v2/key/some-id/user/%2B4917512345678');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { code, op: 'verify' } });
    });
  });

  describe('initPinReset', () => {
    it('should fail on api error', async () => {
      api.get.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.initPinReset({ keyId, userId })).rejects.toThrow(/boom/);
    });

    it('should return 200 on success', async () => {
      api.get.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      await KeyServer.initPinReset({ keyId, userId });
      expect(api.get.mock.calls[0][0]).toBe('/v2/key/some-id/user/%2B4917512345678/reset');
    });
  });

  describe('verifyPinReset', () => {
    it('should fail on api error', async () => {
      api.put.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.verifyPinReset({ keyId, userId, code })).rejects.toThrow(/boom/);
    });

    it('should return 423 on time lock', async () => {
      api.put.mockResolvedValue({
        status: 423,
        body: {
          message: 'Time locked until',
          delay: '2020-06-01T03:33:47.980Z',
        },
      });
      const delay = await KeyServer.verifyPinReset({ keyId, userId, code });
      expect(delay).toBe('2020-06-01T03:33:47.980Z');
      expect(api.put.mock.calls[0][0]).toBe('/v2/key/some-id/user/%2B4917512345678');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { code, op: 'reset-pin' } });
    });

    it('should return 304 for time lock over', async () => {
      api.put.mockResolvedValue({
        status: 304,
        body: { message: 'Success' },
      });
      const delay = await KeyServer.verifyPinReset({ keyId, userId, code });
      expect(delay).toBe(null);
      expect(api.put.mock.calls[0][0]).toBe('/v2/key/some-id/user/%2B4917512345678');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { code, op: 'reset-pin' } });
    });
  });

  describe('finalizePinReset', () => {
    it('should fail on api error', async () => {
      api.put.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.finalizePinReset({ keyId, userId, code, newPin })).rejects.toThrow(/boom/);
    });

    it('should return 200 on success', async () => {
      api.put.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      await KeyServer.finalizePinReset({ keyId, userId, code, newPin });
      expect(api.put.mock.calls[0][0]).toBe('/v2/key/some-id/user/%2B4917512345678');
      expect(api.put.mock.calls[0][1]).toEqual({ body: { code, op: 'reset-pin', newPin } });
      expect(api.auth.mock.calls[0]).toEqual(['', '5678']);
    });
  });

  describe('removeUser', () => {
    it('should fail on api error', async () => {
      api.delete.mockResolvedValue({
        status: 500,
        body: { message: 'boom' },
      });
      await expect(KeyServer.removeUser({ keyId, userId })).rejects.toThrow(/boom/);
    });

    it('should throw delay error on rate limit', async () => {
      api.delete.mockResolvedValue({
        status: 429,
        body: {
          message: 'Time locked until',
          delay: '2020-06-01T03:33:47.980Z',
        },
      });
      await expect(KeyServer.removeUser({ keyId, userId })).rejects.toThrow(KeyServer.RateLimitError);
    });

    it('should return 200 on success', async () => {
      api.delete.mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });
      await KeyServer.removeUser({ keyId, userId });
      expect(api.delete.mock.calls[0][0]).toBe('/v2/key/some-id/user/%2B4917512345678');
    });
  });
});
