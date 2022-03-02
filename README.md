# photon-lib ![Node.js CI](https://github.com/photon-sdk/photon-lib/workflows/Node.js%20CI/badge.svg?branch=master)

A high level library for building bitcoin wallets with react native.

## Scope

Provide an easy-to-use high level api for the following:

* hd wallets (bech32 and p2sh)
* an electrum light client
* secure enclave backed key storage on iOS and Android (where available)
* encrypted key backup on iCloud/GDrive + 2FA (see [photon-keyserver](https://github.com/photon-sdk/photon-keyserver))

## Demo

![restore flow](https://raw.githubusercontent.com/photon-sdk/photon-lib/demo-images/restore_flow.gif)

## Threat model

Please see the [threat model doc](https://github.com/photon-sdk/photon-lib/blob/master/threat-model.md) for a discussion about attack vectors and mitigation strategies.

## Usage

In your react-native app...

### Installing

Make sure to install all peer dependencies:

```
npm install --save @photon-sdk/photon-lib react-native-randombytes react-native-keychain @photon-sdk/react-native-icloudstore @react-native-async-storage/async-storage @photon-sdk/react-native-tcp @react-native-google-signin/google-signin @robinbobin/react-native-google-drive-api-wrapper node-libs-react-native

```

### Update cocoapods

```
npx pod-install
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

### Authenticate Cloud Storage

The encrypted backup is stored on the user's cloud storage account. On Android the user is required to grant access to an app specific Google Drive folder with an OAuth dialog. For iOS apps this step can be ignored as iCloud does not require extra authentication.

```js
await KeyBackup.authenticate({
  clientId: '<FROM DEVELOPER CONSOLE>'   // see the Google Drive API docs
});
```

### Key Backup

Now let's do an encrypted backup of a user's wallet to their iCloud account. The encryption key will be stored on your app's key server. A random `Key ID` (stored automatically on the user's iCloud) and a user chosen `PIN` is used for authentication with the key server.

```js
import { HDSegwitBech32Wallet, KeyBackup } from '@photon-sdk/photon-lib';

const wallet = new HDSegwitBech32Wallet();
await wallet.generate();                         // generate a new seed phrase
const mnemonic = await wallet.getSecret();       // the seed phrase to backup

const data = { mnemonic };                       // backup payload (any attributes possible)
const pin = '1234';                              // PIN for auth to key server
await KeyBackup.createBackup({ data, pin });     // create encrypted cloud backup
```

### Key Restore

Now let's restore the user's wallet on their new device. This will download their encrypted mnemonic from iCloud and decrypt it using the encryption key from the key server. The random `Key ID` (stored on the user's iCloud) and the `PIN` that was set during wallet backup will be used to authenticate with the key server. **N.B. encryption key download is locked for 7 days after 10 failed authentication attempts to mitigate brute forcing of the PIN.**

```js
import { HDSegwitBech32Wallet, KeyBackup, WalletStore } from '@photon-sdk/photon-lib';

const exists = await KeyBackup.checkForExistingBackup();
if (!exists) return;

const pin = '1234';                                    // PIN for auth to key server
const data = await KeyBackup.restoreBackup({ pin });   // fetch and decrypt user's seed

const wallet = new HDSegwitBech32Wallet();
wallet.setSecret(data.mnemonic);                       // restore from the seed

const store = new WalletStore();
store.wallets.push(wallet);
await store.saveToDisk();                              // store securely in device keychain
```

### Change the PIN

Users can change the authentication PIN simply by calling the following api. A PIN must be at least 4 digits, but can also be a complex passphrase up to 256 chars in length.

```js
import { KeyBackup } from '@photon-sdk/photon-lib';

const pin = '1234';
const newPin = 'complex passphrases are also possible';
await KeyBackup.changePin({ pin, newPin });
```

### Add Recovery Phone Number (optional)

In order to allow for wallet recovery in case the user forgets their PIN, a recovery phone number can be set. A 30 day time delay is enforced for PIN recovery to mitigate SIM swap attacks. The phone number is stored in plaintext only on the user's iCloud. A hash of the phone number is stored on the key server for authentication (hashed with scrypt and a random salt).

```js
import { KeyBackup } from '@photon-sdk/photon-lib';

const userId = '+4917512345678';                 // the user's number for 2FA
const pin = '1234';
await KeyBackup.registerPhone({ userId, pin });  // sends code via SMS

const code = '000000';                           // received via SMS
await KeyBackup.verifyPhone({ userId, code });   // verify phone number
```

### Add Recovery Email Address (optional)

In order to allow for wallet recovery in case the user forgets their PIN, a recovery email address can be set. A 30 day time delay is enforced for PIN recovery to mitigate SIM swap attacks. The email address is stored in plaintext only on the user's iCloud. A hash of the email address is stored on the key server for authentication (hashed with scrypt and a random salt).

```js
import { KeyBackup } from '@photon-sdk/photon-lib';

const userId = 'jon@example.com';                // the user's number for 2FA
const pin = '1234';
await KeyBackup.registerEmail({ userId, pin });  // sends code via Email

const code = '000000';                           // received via Email
await KeyBackup.verifyEmail({ userId, code });   // verify phone number
```

### Reset the PIN via Recovery Email Address (works the same via phone)

In case the user forgets their PIN, apps should encourage users to set a recovery phone number or email address during sign up. This can be used later to reset the PIN with a 30 day time delay.

```js
import { KeyBackup } from '@photon-sdk/photon-lib';

const userId = await KeyBackup.getEmail()              // get registered email address
await KeyBackup.initPinReset({ userId });              // start time delay in key server

const code = '123456';                                 // received via SMS or Email
const newPin = '5678';                                 // let user chose new pin
const delay = await KeyBackup.verifyPinReset({ userId, code, newPin });
if (delay) {
  // display delay in the UI and tell user to wait (30 days by default)
  return
}

// if delay is null the time lock is over and pin reset can be confirmed ...

await KeyBackup.initPinReset({ userId });              // call again after 30 day delay

const code = '654321';                                 // received via SMS or Email
await KeyBackup.verifyPinReset({ userId, code, newPin });

const pin = '5678';                                    // use the new pin for recovery
const data = await KeyBackup.restoreBackup({ pin });   // fetch and decrypt user's seed
```

### Init Electrum Client

First we'll need to init the electrum client by specifying the host and port of our full node.

```js
import { ElectrumClient } from '@photon-sdk/photon-lib';

const options = {
  host: 'blockstream.info',
  ssl: '700'
};
await ElectrumClient.connectMain(options);       // connect to your full node
await ElectrumClient.waitTillConnected();
```

### Wallet Balance & Transaction Data

Now we'll generate a new wallet key, store it securely in the device keychain and fetch transactions and balances using the electrum client.

```js
import { HDSegwitBech32Wallet, WalletStore } from '@photon-sdk/photon-lib';

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

### Create & Broadcast Transaction

Finally we'll fetch the wallets utxos, create a new transaction, and broadcast it using the electrum client.

```js
import { HDSegwitBech32Wallet, WalletStore } from '@photon-sdk/photon-lib';

const wallet = new HDSegwitBech32Wallet();
await wallet.generate();                         // or use restored (see above)

await wallet.fetchUtxo();                        // fetch UTXOs
const utxo = wallet.getUtxo();                   // set UTXO as input
const target = [{                                // set output address and value in sats
  value: 1000,
  address: 'some-address'
}];
const feeRate = 1;                               // set fee rate in sat/vbyte
const changeTo = await wallet.getAddressAsync(); // get change address
const newTx = wallet.createTransaction(utxo, target, feeRate, changeTo);

await wallet.broadcastTx(newTx.tx.toHex());      // broadcast tx to the network
```

### Create Multisig Wallet & cosign PSBT

In this example we'll create a 2-of-2 multisig wallet. Cosigners can be added as either xpubs or mnemonics. Once created, the wallet can be interacted with using the same apis as above.

```js
import { MultisigHDWallet, WalletStore } from '@photon-sdk/photon-lib';

const path = "m/48'/0'/0'/2'";
const key1_mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const key2_fp = '05C0D4E1';
const key2_zpub = 'Zpub755JaEN81qADr1Hq22Q6AbiRutDnCMdWghxUrpxkPB5JhdcAzWzQGMiSS58oxEjTqZkxBJ1q6TwvQ1EkiNEsrD18aeVnuJgEDjg1S3ETtd6';

const wallet = new MultisigHDWallet();
wallet.addCosigner(key1_mnemonic);
wallet.addCosigner(key2_zpub, key2_fp);
wallet.setDerivationPath(path);
wallet.setM(2);

const newTx = wallet.createTransaction(utxo, target, feeRate, changeTo); // see above for how to specify args
const signedTx = wallet.cosignPsbt(newTx.psbt);     // cosign the psbt (must be done by both cosigners)

await wallet.broadcastTx(signedTx.tx.toHex());      // broadcast tx to the network
```

## Development and testing

Clone the git repo and then:

```
npm install && npm test
```

## Credit

* The wallet and electrum client implementation is based on BlueWallet ([a7f299d](https://github.com/BlueWallet/BlueWallet/tree/a7f299d667ba57dff7b91e00763b009a6ea14256)).
* [BitcoinJS](https://github.com/bitcoinjs/bitcoinjs-lib) is used for bips and low level primitives
* Key storage is done via [react-native-keychain](https://github.com/oblador/react-native-keychain)
