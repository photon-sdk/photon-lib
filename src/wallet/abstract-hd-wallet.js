import * as bitcoin from 'bitcoinjs-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import { LegacyWallet } from './legacy-wallet';
import * as bip39 from 'bip39';
import * as BlueElectrum from '../BlueElectrum';

/**
 * @deprecated
 */
export class AbstractHDWallet extends LegacyWallet {
  static type = 'abstract';
  static typeReadable = 'abstract';

  constructor() {
    super();
    this.next_free_address_index = 0;
    this.next_free_change_address_index = 0;
    this.internal_addresses_cache = {}; // index => address
    this.external_addresses_cache = {}; // index => address
    this._xpub = ''; // cache
    this.usedAddresses = [];
    this._address_to_wif_cache = {};
    this.gap_limit = 20;
  }

  getNextFreeAddressIndex() {
    return this.next_free_address_index;
  }

  getNextFreeChangeAddressIndex() {
    return this.next_free_change_address_index;
  }

  prepareForSerialization() {
    // deleting structures that cant be serialized
    delete this._node0;
    delete this._node1;
  }

  generate() {
    throw new Error('Not implemented');
  }

  allowSend() {
    return false;
  }

  getTransactions() {
    throw new Error('Not implemented');
  }

  setSecret(newSecret) {
    this.secret = newSecret.trim().toLowerCase();
    this.secret = this.secret.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ');
    return this;
  }

  /**
   * @return {Boolean} is mnemonic in `this.secret` valid
   */
  validateMnemonic() {
    return bip39.validateMnemonic(this.secret);
  }

  getMnemonicToSeedHex() {
    return bip39.mnemonicToSeedSync(this.secret).toString('hex');
  }

  /**
   * Derives from hierarchy, returns next free address
   * (the one that has no transactions). Looks for several,
   * gives up if none found, and returns the used one
   *
   * @return {Promise.<string>}
   */
  async getAddressAsync() {
    // looking for free external address
    let freeAddress = '';
    let c;
    for (c = 0; c < this.gap_limit + 1; c++) {
      if (this.next_free_address_index + c < 0) continue;
      const address = this._getExternalAddressByIndex(this.next_free_address_index + c);
      this.external_addresses_cache[this.next_free_address_index + c] = address; // updating cache just for any case
      let txs = [];
      try {
        txs = await BlueElectrum.getTransactionsByAddress(address);
      } catch (Err) {
        console.warn('BlueElectrum.getTransactionsByAddress()', Err.message);
      }
      if (txs.length === 0) {
        // found free address
        freeAddress = address;
        this.next_free_address_index += c; // now points to _this one_
        break;
      }
    }

    if (!freeAddress) {
      // could not find in cycle above, give up
      freeAddress = this._getExternalAddressByIndex(this.next_free_address_index + c); // we didnt check this one, maybe its free
      this.next_free_address_index += c; // now points to this one
    }
    this._address = freeAddress;
    return freeAddress;
  }

  /**
   * Derives from hierarchy, returns next free address
   * (the one that has no transactions) + subsequent n-1 addresses.
   * Looks for several, gives up if none found, and returns the
   * used one.
   *
   * @return {Promise.<string[]>}
   */
  async getNextAddressesAsync(number) {
    // get next free address
    const nextFreeAddress = await this.getAddressAsync();

    // retrieve next n-1 addresses too
    const nextFreeIndex = parseFloat(this._getDerivationPathByAddress(nextFreeAddress).slice(-1));

    // unnecessary and causes false flags, removing for now
    // // sanity check - this address must match just found freeAddress
    // if (this._address !== this._getExternalAddressByIndex(nextFreeIndex)) {
    //   // TODO - properly handle error
    //   throw new Error('Derivation path error - DANGEROUS');
    // }

    let c;
    const nextFreeAddresses = [];
    for (c = 0; c < number; c++) {
      const nextAddressObject = {
        index: nextFreeIndex + c,
        address: this._getExternalAddressByIndex(nextFreeIndex + c),
      };
      nextFreeAddresses.push(nextAddressObject);
    }

    return nextFreeAddresses;
  }
  // return object: [{ index: "", address: ""}, ...]

  /**
   * Derives from hierarchy, returns next free CHANGE address
   * (the one that has no transactions). Looks for several,
   * gives up if none found, and returns the used one
   *
   * @return {Promise.<string>}
   */
  async getChangeAddressAsync() {
    // looking for free internal address
    let freeAddress = '';
    let c;
    for (c = 0; c < this.gap_limit + 1; c++) {
      if (this.next_free_change_address_index + c < 0) continue;
      const address = this._getInternalAddressByIndex(this.next_free_change_address_index + c);
      this.internal_addresses_cache[this.next_free_change_address_index + c] = address; // updating cache just for any case
      let txs = [];
      try {
        txs = await BlueElectrum.getTransactionsByAddress(address);
      } catch (Err) {
        console.warn('BlueElectrum.getTransactionsByAddress()', Err.message);
      }
      if (txs.length === 0) {
        // found free address
        freeAddress = address;
        this.next_free_change_address_index += c; // now points to _this one_
        break;
      }
    }

    if (!freeAddress) {
      // could not find in cycle above, give up
      freeAddress = this._getInternalAddressByIndex(this.next_free_change_address_index + c); // we didnt check this one, maybe its free
      this.next_free_change_address_index += c; // now points to this one
    }
    this._address = freeAddress;
    return freeAddress;
  }

  /**
   * Should not be used in HD wallets
   *
   * @deprecated
   * @return {string}
   */
  getAddress() {
    return this._address;
  }

  /**
   * Signs text message using address private key and returns signature
   *
   * @param message {string}
   * @param address {string}
   * @returns {string} base64 encoded signature
   */
  signMessage(message, address, useSegwit = true) {
    const wif = this._getWifForAddress(address);
    if (wif === null) throw new Error('Invalid address');
    const keyPair = bitcoin.ECPair.fromWIF(wif);
    const privateKey = keyPair.privateKey;
    const options = this.segwitType && useSegwit ? { segwitType: this.segwitType } : undefined;
    const signature = bitcoinMessage.sign(message, privateKey, keyPair.compressed, options);
    return signature.toString('base64');
  }
  
  /**
   * Verifies text message signature by address
   *
   * @param message {string}
   * @param address {string}
   * @param signature {string}
   * @returns {boolean} base64 encoded signature
   */
  verifyMessage(message, address, signature) {
    // null, true so it can verify Electrum signatures without errors
    return bitcoinMessage.verify(message, address, signature, null, true);
  }

  _getExternalWIFByIndex(index) {
    throw new Error('Not implemented');
  }

  _getInternalWIFByIndex(index) {
    throw new Error('Not implemented');
  }

  _getExternalAddressByIndex(index) {
    throw new Error('Not implemented');
  }

  _getInternalAddressByIndex(index) {
    throw new Error('Not implemented');
  }

  getXpub() {
    throw new Error('Not implemented');
  }

  /**
   * Async function to fetch all transactions. Use getter to get actual txs.
   * Also, sets internals:
   *  `this.internal_addresses_cache`
   *  `this.external_addresses_cache`
   *
   * @returns {Promise<void>}
   */
  async fetchTransactions() {
    throw new Error('not implemented');
  }

  /**
   * Given that `address` is in our HD hierarchy, try to find
   * corresponding WIF
   *
   * @param address {String} In our HD hierarchy
   * @return {String} WIF if found
   */
  _getWifForAddress(address) {
    if (this._address_to_wif_cache[address]) return this._address_to_wif_cache[address]; // cache hit

    // fast approach, first lets iterate over all addressess we have in cache
    for (const index of Object.keys(this.internal_addresses_cache)) {
      if (this._getInternalAddressByIndex(index) === address) {
        return (this._address_to_wif_cache[address] = this._getInternalWIFByIndex(index));
      }
    }

    for (const index of Object.keys(this.external_addresses_cache)) {
      if (this._getExternalAddressByIndex(index) === address) {
        return (this._address_to_wif_cache[address] = this._getExternalWIFByIndex(index));
      }
    }

    // no luck - lets iterate over all addresses we have up to first unused address index
    for (let c = 0; c <= this.next_free_change_address_index + this.gap_limit; c++) {
      const possibleAddress = this._getInternalAddressByIndex(c);
      if (possibleAddress === address) {
        return (this._address_to_wif_cache[address] = this._getInternalWIFByIndex(c));
      }
    }

    for (let c = 0; c <= this.next_free_address_index + this.gap_limit; c++) {
      const possibleAddress = this._getExternalAddressByIndex(c);
      if (possibleAddress === address) {
        return (this._address_to_wif_cache[address] = this._getExternalWIFByIndex(c));
      }
    }

    throw new Error('Could not find WIF for ' + address);
  }

  async fetchBalance() {
    throw new Error('Not implemented');
  }

  /**
   * @inheritDoc
   */
  async fetchUtxo() {
    throw new Error('Not implemented');
  }

  weOwnAddress(addr) {
    const hashmap = {};
    for (const a of this.usedAddresses) {
      hashmap[a] = 1;
    }

    return hashmap[addr] === 1;
  }

  _getDerivationPathByAddress(address) {
    throw new Error('Not implemented');
  }

  _getNodePubkeyByIndex(address) {
    throw new Error('Not implemented');
  }
}
