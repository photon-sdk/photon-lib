import assert from 'assert';
import { SegwitP2SHWallet, WalletStore } from '../../';

it('WalletStore - loadFromDisk works', async () => {
  /** @type {WalletStore} */
  const Storage = new WalletStore();
  const w = new SegwitP2SHWallet();
  w.setLabel('testlabel');
  await w.generate();
  Storage.wallets.push(w);
  await Storage.saveToDisk();

  // saved, now trying to load

  const Storage2 = new WalletStore();
  await Storage2.loadFromDisk();
  assert.strictEqual(Storage2.wallets.length, 1);
  assert.strictEqual(Storage2.wallets[0].getLabel(), 'testlabel');
});
