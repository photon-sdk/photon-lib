//
//  chachaTests.swift
//  chachaTests
//
//  Created by Leon Johnson on 27/09/2020.
//  Copyright © 2020 Leon Johnson. All rights reserved.
//

import CryptoKit
import XCTest
@testable import chacha

class ChachaTests: XCTestCase {
    
    private var cha: ChaCha!
    
    override func setUp() {
        cha = ChaCha()
    }

    override func tearDown() {
        cha = nil
    }
    
    func testGenerateKey_RandomKey(){
        let key:SymmetricKey = cha.generateKey()
        XCTAssertNotNil(key)
        XCTAssertEqual(key.bitCount, 256)
    }
    
    /// This unit test checks whether the data can be encrypted and then decrypted using the same key
    func testEncryptionKeyIsSymmetric(){
        // Given
        let secret = "bottom evoke mask jar patch distance force invite senior soccer allow youth normal beauty joke live rebel charge merge episode abandon donor screen video"
        print("The encrypted data is: \(secret)")
        let encryptedSecret = secret.data(using: .utf8)
        let key: SymmetricKey = cha.generateKey()
        let keyAsData = key.withUnsafeBytes({
            return Data(Array($0))
        })
        
        // When
        let sealedBox = try! cha.encrypt(secret: encryptedSecret!, key: keyAsData) //sealedbox as bytes
        let openedBox = try! cha.decrypt(cipher_bytes: sealedBox!, key: keyAsData)
        let decodedSecret = String(decoding: openedBox!, as: UTF8.self)
        
        // Then
        XCTAssertEqual(secret, decodedSecret)
    }
    
    /// This unit test checks whether the data can be decrypted using an incorrect key
    func testDecryptionWithWrongKey(){
        // Given
        let correctKey: SymmetricKey = cha.generateKey()
        let incorrectKey: SymmetricKey = cha.generateKey()
        let secret = "my secret"
        let encryptedSecret: Data? = secret.data(using: .utf8)
        
        // When
        if let sealedBox = try? ChaChaPoly.seal(encryptedSecret!, using: correctKey) {
            if let openedBox = try? ChaChaPoly.open(sealedBox, using: incorrectKey) {
                let originalSecret: String = String(decoding: openedBox, as: UTF8.self)
                
                // Then
                XCTAssertNotEqual(secret, originalSecret)
            }
        }
    }
    
    func testWrongKeySizeForEncryption(){
       // Given
       let secret = "my secret"
       let encryptedSecret = secret.data(using: .utf8)
       let fakeKey = "fake key"
       let fakeKeyAsData = fakeKey.data(using: .utf8)
       
       // When
       let sealedBox = try? cha.encrypt(secret: encryptedSecret!, key: fakeKeyAsData!)
        
       // Then
       XCTAssertNil(sealedBox)
    }
    
    func testWrongKeySizeForDecryption(){
       // Given
       let secret = "my secret"
       let encryptedSecret = secret.data(using: .utf8)
       let fakeKey = "fake key"
       let fakeKeyAsData = fakeKey.data(using: .utf8)
       let key = cha.generateKey()
       let keyAsData = key.withUnsafeBytes({
           return Data(Array($0))
       })
       
        // When
       let sealedBox = try? cha.encrypt(secret: encryptedSecret!, key: keyAsData)
       let openBox = try? cha.decrypt(cipher_bytes: sealedBox!, key: fakeKeyAsData!)
        
       // Then
       XCTAssertNil(openBox)
        
    }
    
    /// This unit test takes a key and sealedbox, generated using the  encrypt() function in chachatest.js, and decrypts it using Apple's CryptoKit implementation. The JS output was obtained by console.log'ing the key and sealedbox as a Buffer() string and then copying this into the unit test below.
    func testJSSealedboxIsDecryptedCorrectly(){
        // Given
        let jsKeyHex = "0b9da4d2aa1802e32a89716e44cffcf4b6bcfe891435b9fd67797a627d4f5aea"
        let jsKey = Data(hexString: jsKeyHex)
        
        let encryptedTextAsBuffer = "05 74 91 6a 2d 6a a2 8c 7b aa e4 de ef f8 58 dc 27 7b 17 ac 4b 29 1d ac 69 a9 a1 b6 8b 04 21 12 2e 0b e2 4e d3 2e 6b 69"
        let encryptedTextAsBufferWithoutSpaces = encryptedTextAsBuffer.components(separatedBy: .whitespaces).joined()
        let jsSealedBox = Data(hexString: encryptedTextAsBufferWithoutSpaces)
        
        // When
        let openedBox = try? cha.decrypt(cipher_bytes: jsSealedBox!, key: jsKey!)
        let decodedSecret = String(decoding: openedBox!, as: UTF8.self)
        
        // Then
        XCTAssertEqual(decodedSecret, "secret stuff")
    }

}
