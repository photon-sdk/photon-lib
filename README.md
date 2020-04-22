# photon-lib [![Build Status](https://travis-ci.org/photon-sdk/photon-lib.svg?branch=master)](https://travis-ci.org/photon-sdk/photon-lib)

**Still very much under development and not yet recommended for production use.**

## Scope

Provide an easy-to-use high level api for the following:

* hd wallets (bech32 and p2sh)
* an electrum light client
* hardware backed key storage on iOS and Android (where available)
* encrypted key backup on iCloud/GDrive + 2FA (see [photon-keyserver](https://github.com/photon-sdk/photon-keyserver))

## Usage

Install with peer dependencies:

```
npm install --save @photon-sdk/photon-lib react-native-randombytes react-native-keychain @photon-sdk/react-native-tcp
```

Update cocoapods:

```
cd ios && pod install && cd ..
```

## Development and testing

Clone the git repo and then:

```
npm install && npm test
```

## Credit

* The wallet and electrum client implementation is based on [BlueWallet](https://github.com/BlueWallet/BlueWallet).
* [BitcoinJS](https://github.com/bitcoinjs/bitcoinjs-lib) is used for bips and low level primitives
* Key storage is done via [react-native-keychain](https://github.com/oblador/react-native-keychain)
