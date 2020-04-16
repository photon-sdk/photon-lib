# photon-lib
A client library for building bitcoin wallets in javascript

**Still very much under development and not yet recommended for production use.**

The goal of this library is to provide secure and easy-to-use high level apis for react native wallet developers. The scope currently includes:

* hd bech32 and p2sh wallets
* an electrum light client
* hardware backed key storage on iOS & Android (where available)
* bip38 private key encryption
* secure key backup/sync (see [photon-keyserver](https://github.com/photon-sdk/photon-keyserver))

## Credit

* The on-chain wallet and electrum client implementation is based on [BlueWallet](https://github.com/BlueWallet/BlueWallet).
* Key storage relies on [react-native-keychain](https://github.com/oblador/react-native-keychain)
