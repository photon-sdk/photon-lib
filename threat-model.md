# Threat model

## Introduction

The goal of the Photon SDK is to provide mobile bitcoin wallet developers with the building blocks for secure and easy-to-use key management. One very sensitive component is the seedless wallet backup. In this protocol the wallet private key is stored encrypted on iCloud/GDrive. The encryption key used to secure cloud content is stored on the photon-keyserver. We use the user's phone number to authenticate download of the encryption key. It should be noted that this protocol is intended for small amounts of bitcoin. For larger amounts a hardware wallet or multisig setup is recommended. In the following we discuss potential attack vectors and mitigation strategies.

## Assets

These are the assets to protect or mitigate loss of:

* The wallet private key on the device
* The encrypted wallet backup on iCloud/GDrive
* The encryption key stored on the photon-keyserver
* The SIM card / phone number required for authentication

## Threats

### Lost or stolen phone

In case the user loses their phone, the wallet private key is protected in the device keychain. On iOS this is secured by the secure enclave and full disk encryption. On newer Android devices like the Pixel 3a, a similar level of security is available through the Titan M security module. On older Android devices only software level encryption is available, which is more susceptible to brute force attacks. In order to mitigate compromise of the old device's keychain, the wallet should recommend key rotation upon recovery.

### Damaged phone

If the user's phone is damaged but they still have access to the SIM card, they can login into their iCloud/GDrive account on a new device and recover their wallet via SMS verification. In order to mitigate compromise of the old device's keychain, the wallet should recommend key rotation.

### Lost SIM card

In case the user loses their SIM card together with their phone, they are still able to recovery their wallet after they’ve received a replacement SIM from their mobile service provider.

In the case of a prepaid SIM card this might not be possible. For this case the user should be able to provide a fallback 2FA method such as [Email](https://github.com/photon-sdk/photon-keyserver/issues/4), [Google Authenticator](https://github.com/photon-sdk/photon-keyserver/issues/7) or [FIDO U2F](https://github.com/photon-sdk/photon-keyserver/issues/8) physical security keys.

### Lost iCloud/GDrive account access

In case the user loses access to their iCloud or Gmail account or there is a data integrity glitch in the cloud storage of these providers, the user can only recover their funds if they still have a device with a wallet present. In this case they can send the funds to another wallet using a regular bitcoin transaction.

While the possibility of the user losing their phone and losing access to their cloud account is possible. Users can mitigate this unlikely scenario by syncing the wallet to a second device before their primary phone is lost.

Wallet developers should also implement regular [backup integrity checks](https://github.com/photon-sdk/photon-keyserver/issues/5) to "practice" a wallet restore and make sure all required assets are available.

### Compromise of iCloud/GDrive account

In case the iCloud/GDrive account is compromised the wallet private key is protected using 256 bit encryption using the [ChaCha20](https://en.wikipedia.org/wiki/Salsa20)-[Poly1305](https://en.wikipedia.org/wiki/Poly1305) algorithm ([IETF variant](https://tools.ietf.org/html/rfc7539) with a 96 bit nonce). The attacker would required access to the user’s SIM card as well to recover the wallet and steal funds.

### Compromise of photon-keyserver database

In case the keyserver is compromised the adversary would have access to all of the encryption keys, but not of users’ iCloud/GDrive accounts. Upon detection of the compromise of the keyserver database, a public announcement should be made to ask users to re-register and rotate encryption keys.

To make targeting the users' iCloud/GDrive accounts more difficult in case of a database breach, user identifiers such as phone numbers and email addresses are hashed using the [scrypt](https://en.wikipedia.org/wiki/Scrypt) key derivation function. A random salt is used to mitigate [rainbow table attacks](https://en.wikipedia.org/wiki/Rainbow_table).

In addition the keyserver DynamoDB database is [encrypted at rest](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/EncryptionAtRest.html) using [HSM backed key management](https://aws.amazon.com/kms/).

### SIMjacking a.k.a SIM swap attacks

In case an adversary gains access to the user’s phone number e.g. via a successful social engineering attack towards the user’s mobile service provider, the attacker could attempt to reset the user’s iCloud/Gmail password via the phone based „forgot password“ recovery option. In case the user does not use 2FA for their iCloud/Gmail accounts or they use SMS based 2FA, an attacker would be able to gain access to all of the assets necessary to recovery the user’s wallet backup.

Users can obviously take steps to mitigate this threat by deactivating phone based recovery for their iCloud/Gmail accounts. This threat model should assume that a user hasn’t taken those steps and is vulnerable to this attack.

#### Mitigation: additional PIN

To mitigate stealing of user funds an [additional PIN](https://github.com/photon-sdk/photon-keyserver/issues/2) can be added to safeguard downloading the encryption key from the photon-keyserver. Brute forcing the PIN would be mitigated by increasing retry intervals in the photon-keyserver.

#### Mitigation: recovery time delay

Another option would be to set an [additional time delay](https://github.com/photon-sdk/photon-keyserver/issues/3) that the user would be required to wait to recover their wallet. This should be set long enough so that the user has enough time to notice the lost access to their phone number and recover access from their mobile service provider.

The general strategy for wallets should be to promote these additional security features in the wallet user interface once the deposited value reaches a certain threshold.

## Threats that are out of scope

### Compromise of the Mobile OS

If the mobile operating system or hardware becomes compromised, the user’s wallet private key could also be stolen from the device. There isn’t much that can be done at the software level to mitigate this threat.

### Flaws in the encryption algorithm

If there is a security vulnerability in the ChaCha20-Poly1305 algorithm this could also lead to compromise of the wallet private key in the iCloud/GDrive account. Users should be notified in this case.
