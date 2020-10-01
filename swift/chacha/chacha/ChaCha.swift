//
//  ChaCha.swift
//  chacha
//
//  Created by Leon Johnson on 27/09/2020.
//  Copyright © 2020 Leon Johnson. All rights reserved.
//

import Foundation
import CryptoKit



class ChaCha {
    
    enum ChaChaErrors: Error {
    case keyIsWrongSize
    }
    
    /// This function generates a random key that is 32 bytes in length
    func generateKey() -> SymmetricKey {
        let key = SymmetricKey(size: .bits256)
        return key
    }
    
    
    /// This function encrypts a secret (Data) using a key (Data). It returns a data object (bytes) or nil.
    func encrypt(secret:Data, key:Data) throws -> Data? {
        let symmetric_key = SymmetricKey(data: key)
        guard symmetric_key.bitCount == 256 else {
            print("The key is the not 32 bytes long")
            throw ChaChaErrors.keyIsWrongSize
        }
        let sealedBox = try? ChaChaPoly.seal(secret, using: symmetric_key).combined
        return sealedBox
    }
    
    
    /// This function decrypts a secret (Data) using a key (Data). It returns a data object (bytes) or nil.
    func decrypt(cipher_bytes:Data, key:Data) throws -> Data? {
        let sealedBox = try! ChaChaPoly.SealedBox(combined: cipher_bytes) // turn bytes to a sealedbox
        let symmetric_key = SymmetricKey(data: key) // turn bytes to a SymmetricKey
        
        // check the key is 32 bytes in length
        guard symmetric_key.bitCount == 256 else {
            print("The key is the not 32 bytes long")
            throw ChaChaErrors.keyIsWrongSize
        }
        
        let openedBox = try? ChaChaPoly.open(sealedBox, using: symmetric_key) // Open the box with the key
        let original_secret = String(decoding: openedBox!, as: UTF8.self) // convert the data (bytes) to a string
        print("The decrypted data is: \(original_secret)")
        return openedBox
    }
}

