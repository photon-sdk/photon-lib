# photon-lib [![Build Status](https://travis-ci.org/photon-sdk/photon-lib.svg?branch=master)](https://travis-ci.org/photon-sdk/photon-lib)

A high level library for building bitcoin wallets with react native.

**Still very much under development and not yet recommended for production use.**

## Scope

Provide an easy-to-use high level api for the following:

* hd wallets (bech32 and p2sh)
* an electrum light client
* hardware backed key storage on iOS and Android (where available)
* encrypted key backup on iCloud/GDrive + 2FA (see [photon-keyserver](https://github.com/photon-sdk/photon-keyserver))

## Usage

In your react-native app...

### Installing

Make sure to install all peer dependencies:

```
npm install --save @photon-sdk/photon-lib react-native-randombytes react-native-keychain react-native-icloudstore @react-native-community/async-storage @photon-sdk/react-native-tcp node-libs-react-native
```

### Update cocoapods

```
cd ios && pod install && cd ..
```

### Configure Xcode project

In your target's "capabilities" tab in Xcode, make sure that iCloud is switched on as well as make sure that the "Key-value storage" option is checked.

### Wire up node libs

Follow the [usage instructions for node-libs-react-native](https://github.com/parshap/node-libs-react-native#usage).

## Sample app

An example app using photon-lib can be found here [photon-sdk/photon-app](https://github.com/photon-sdk/photon-app).

[This PR shows what the diff should look](https://github.com/photon-sdk/photon-app/pull/1/files) like when installing photon-lib to your react-native app.

## Example

### Init Key Server

First we'll need to tell the key backup module which key server to use. See [photon-sdk/photon-keyserver](https://github.com/photon-sdk/photon-keyserver) for how to deploy a key server instance for your app.

```js
import { KeyBackup } from '@photon-sdk/photon-lib';

KeyBackup.init({
  keyServerURI: 'http://localhost:3000'  // your key server instance
});
```

### Key Backup

Now let's do an encrypted backup of a user's mnemonic to their iCloud account. The encryption key will be stored on your app's key server. We'll use the user's phone number for authentication with the key server.

```js
import { HDSegwitBech32Wallet, KeyBackup } from '@photon-sdk/photon-lib';

const wallet = new HDSegwitBech32Wallet();
await wallet.generate();                         // generate a new seed phrase
const mnemonic = await wallet.getSecret();       // the seed phrase to backup

const phone = '+4917512345678';                  // the user's number for 2FA
await KeyBackup.registerNewUser({ phone });      // sends code via SMS

const code = '000000'                            // received via SMS
await KeyBackup.verifyNewUser({ phone, code });  // verify phone number

await KeyBackup.createBackup({ mnemonic });      // create encrypted cloud backup
```

### Key Restore

Now let's restore the user's key on their new device. This will download their encrypted mnemonic from iCloud and decrypt it using the encryption key. The same phone number as for backup will be used to authenticate to the key server.

```js
import { HDSegwitBech32Wallet, KeyBackup } from '@photon-sdk/photon-lib';

const exists = await KeyBackup.checkForExistingBackup({ phone });
if (!exists) return;

await KeyBackup.registerDevice({ phone });             // sends code via SMS

const code = '000000'                                  // received via SMS
await KeyBackup.verifyDevice({ phone, code });         // verify phone number

const { mnemonic } = await KeyBackup.restoreBackup();  // fetch and decrypt user's seed

const wallet = new HDSegwitBech32Wallet();
wallet.setSecret(mnemonic);                            // restore from the seed
wallet.validateMnemonic();                             // should return true
```

### Wallet & Electrum Client

In this example we'll use the wallet and electrum client to generate a new wallet key, store it securely in the device keychain and fetch transactions and balances.

```js
import { ElectrumClient, HDSegwitBech32Wallet, WalletStore } from '@photon-sdk/photon-lib';

const options = {
  host: 'electrum.example.com',
  ssl: '443'
};
await ElectrumClient.connectMain(options);       // connect to your full node
await ElectrumClient.waitTillConnected();

const wallet = new HDSegwitBech32Wallet();
await wallet.generate();                         // or use restored (see above)

const store = new WalletStore();
store.wallets.push(wallet);
await store.saveToDisk();                        // store securely in device keychain

await store.fetchWalletBalances();               // get wallet balances from electrum
await store.fetchWalletTransactions();           // get wallet transactions from electrum

const balance = store.getBalance();              // the wallet balance to display in the ui

const address = await wallet.getAddressAsync();  // a new address to receive bitcoin
```

## Development and testing

Clone the git repo and then:

```
npm install && npm test
```

## Credit

* The wallet and electrum client implementation is based on BlueWallet ([5b029e2](https://github.com/BlueWallet/BlueWallet/tree/5b029e2fa2f4875161b640d402edd79ada477021)).
* [BitcoinJS](https://github.com/bitcoinjs/bitcoinjs-lib) is used for bips and low level primitives
* Key storage is done via [react-native-keychain](https://github.com/oblador/react-native-keychain)
