import { SegwitP2SHWallet, AppStorage } from '../../src/class';
let assert = require('assert');

it('Appstorage - loadFromDisk works', async () => {
  /** @type {AppStorage} */
  let Storage = new AppStorage();
  let w = new SegwitP2SHWallet();
  w.setLabel('testlabel');
  await w.generate();
  Storage.wallets.push(w);
  await Storage.saveToDisk();

  // saved, now trying to load

  let Storage2 = new AppStorage();
  await Storage2.loadFromDisk();
  assert.strictEqual(Storage2.wallets.length, 1);
  assert.strictEqual(Storage2.wallets[0].getLabel(), 'testlabel');
});
