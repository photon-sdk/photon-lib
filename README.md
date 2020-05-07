# photon-lib [![Build Status](https://travis-ci.org/photon-sdk/photon-lib.svg?branch=master)](https://travis-ci.org/photon-sdk/photon-lib)

**Still very much under development and not yet recommended for production use.**

## Scope

Provide an easy-to-use high level api for the following:

* hd wallets (bech32 and p2sh)
* an electrum light client
* hardware backed key storage on iOS and Android (where available)
* encrypted key backup on iCloud/GDrive + 2FA (see [photon-keyserver](https://github.com/photon-sdk/photon-keyserver))

## Usage

### Installing

Make sure to install all peer dependencies.

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
import { KeyBackup } from '@photon-sdk/photon-lib';

const mnemonic = 'abandon ... about';            // the secret to backup
const phone = '+4917512345678';                  // the user's number for 2FA

await KeyBackup.registerNewUser({ phone });      // sends code via SMS

const code = '000000'                            // received via SMS
await KeyBackup.verifyNewUser({ phone, code });  // verify phone number
await KeyBackup.createBackup({ mnemonic });      // create encrypted cloud backup
```

### Key Restore

Now let's restore the user's the user's key on their new device. This will download their encrypted mnemonic from iCloud and decrypt it using the encryption key. The same phone number as for backup will be used to authenticate to the key server.

```js
import { KeyBackup, Keychain } from '@photon-sdk/photon-lib';

const exists = await KeyBackup.checkForExistingBackup({ phone });
if (!exists) return;

await KeyBackup.registerDevice({ phone });             // sends code via SMS

const code = '000000'                                  // received via SMS
await KeyBackup.verifyDevice({ phone, code });         // verify phone number

const { mnemonic } = await KeyBackup.restoreBackup();  // fetch and decrypt user's seed
await Keychain.setItem('my-seed', mnemonic)            // secure in device keychain

```

## Sample app

To see a working version take a look at [photon-sdk/photon-app](https://github.com/photon-sdk/photon-app).

## Development and testing

Clone the git repo and then:

```
npm install && npm test
```

## Credit

* The wallet and electrum client implementation is based on BlueWallet ([5b029e2](https://github.com/BlueWallet/BlueWallet/tree/5b029e2fa2f4875161b640d402edd79ada477021)).
* [BitcoinJS](https://github.com/bitcoinjs/bitcoinjs-lib) is used for bips and low level primitives
* Key storage is done via [react-native-keychain](https://github.com/oblador/react-native-keychain)
