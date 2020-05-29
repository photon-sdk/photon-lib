# Threat model

## Introduction

The goal of the Photon SDK is to provide mobile bitcoin wallet developers with the building blocks for secure and easy-to-use key management. One very sensitive component is the seedless wallet backup. In this protocol the wallet private key is stored encrypted on iCloud/GDrive. The encryption key used to secure cloud content is stored on the photon-keyserver. We use the user's phone number to authenticate download of the key. In the following we discuss potential attack vectors and mitigation strategies.

## Assets

These are the assets that the protocol should protect:

* The wallet private key on the device
* The encrypted wallet backup on iCloud/GDrive
* The encryption key stored on the photon-keyserver
* The SIM card / phone number required for authentication

## Threats

### Lost or stolen phone

In case the user loses their phone, the wallet private key is protected in the device keychain. On iOS this is secured by the secure enclave and and device level disk encryption. On newer Android devices like the Pixel 3a a similar level of device security through the Titan M security module. On older Android devices only software level encryption is available, which is more susceptible to brute force attacks.

If the user still has the SIM card, they can login into their iCloud/GDrive account on their new device and recover their wallet via SMS verification.

### Lost SIM card

In case the user loses their SIM card together with their phone they are still able to recovery their wallet after they’ve received a replacement SIM from their mobile service provider.

In the case of a prepaid SIM card this might not be possible. For this case the user should be able to provide a fallback 2FA method such as Email and/or Google Authenticator.

### Lost iCloud/GDrive account access

In case the user loses access to their iCloud or Gmail account or there is a data integrity glitch in the cloud storage of these providers, they can only recover their funds if they still have a device with a wallet still present. In this case they can still send the funds to another wallet using a regular bitcoin transaction.

While the possibility of the user losing their phone and losing access to their cloud account is possible. Users can mitigate this unlikely scenario by syncing the wallet to a second device before their primary phone is lost.

### Compromise of iCloud/GDrive account

In case the iCloud/GDrive account is compromised the wallet private key is protected using 256 bit encryption using the ChaCha20-Poly1305 algorithm. The attacker would required access to the user’s phone number as well to recover the wallet and steal funds.

### Compromise of photon-keyserver database

In case the keyserver is compromised the adversary would have access to all of the encryption keys, but not of users’ iCloud/GDrive accounts. Upon detection of the compromise the keyserver database. A public announcement should be made to ask users to re-register and rotate encryption keys.

### SIMjacking a.k.a SIM swap attacks

In case an adversary gains access to the user’s phone number e.g. via a successful social engineering attack towards the user’s mobile service provider, the attacker could attempt to reset the user’s iCloud/Gmail password via the phone based „forgot password“ recovery. In case the user does not use 2FA for their iCloud/Gmail accounts or they user SMS based 2FA, an attacker would be able to gain access to all the assets necessary to recovery the user’s wallet private key backup.

Users can obviously take steps to mitigate this threat by deactivating phone based recovery for their iCloud/Gmail accounts. This threat model should assume that a user hasn’t taken those steps and is vulnerable to this attack.

#### Mitigation: additional PIN

To mitigate stealing of user funds an [additional PIN](https://github.com/photon-sdk/photon-keyserver/issues/2) can be added to safeguard downloading the encryption key from the photon-keyserver. Brute forcing the PIN would be mitigated by increasing retry intervals in the photon-keyserver.

#### Mitigation: recovery time delay

Another option would be to set an [additional time delay](https://github.com/photon-sdk/photon-keyserver/issues/3) that the user would be required to wait to recover their wallet. This should be set long enough so that the user has enough time to notice the lost access to their phone number and/or email account and recovery access from their mobile service provider.

The general strategy for wallets should be to promote these additional features security in the wallet user interface once the deposited value reaches a certain threshold.

### Threats that are out of scope

#### Compromise of the Mobile OS

If the mobile operating system or hardware becomes compromised, the user’s wallet private key could also be stolen from the device. There isn’t much that can be done at the software level to mitigate this threat.

#### Flaws in the encryption algorithm

If there is a security vulnerability in the ChaCha20-Poly1305 algorithm this could also lead to compromise of the wallet private key e.g. if the iCloud/GDrive account is compromised. Users should be notified in this case, but these types of vulnerabilities are generally out of scope for the threat model.
