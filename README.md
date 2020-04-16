# photon-lib
A high level library for building bitcoin wallets with react native

**Still very much under development and not yet recommended for production use.**

## v1 Scope:

* hd wallets (bech32 and p2sh)
* an electrum light client
* hardware backed key storage on iOS and Android (where available)
* Encrypted key backup on iCloud/GDrive + 2FA (see [photon-keyserver](https://github.com/photon-sdk/photon-keyserver))

## Installation

```
# install with peer dependencies
npm install --save photon-lib react-native-randombytes react-native-secure-key-store
# update cocoapods
cd ios && pod install && cd ..
```

## Credit

* The wallet and electrum client implementation is based on [BlueWallet](https://github.com/BlueWallet/BlueWallet).
* [BitcoinJS](https://github.com/bitcoinjs/bitcoinjs-lib) is used for bips and low level primitives
* Key storage is done via [react-native-secure-key-store](https://github.com/pradeep1991singh/react-native-secure-key-store)
