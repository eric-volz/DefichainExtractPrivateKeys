//Imports
import { generateMnemonicWords, Bip32Options, MnemonicHdNodeProvider, validateMnemonicSentence } from "@defichain/jellyfish-wallet-mnemonic"
import { WalletAccount, WalletAccountProvider, WalletEllipticPair, JellyfishWallet } from '@defichain/jellyfish-wallet'
import { Network, MainNet } from '@defichain/jellyfish-network'
import { Elliptic, WIF } from "@defichain/jellyfish-crypto"
const prompt = require('prompt-sync')({sigint: true});

// All needed Classes and Constants

// Class for displaying the right Address Formats
class Options implements Bip32Options {
    bip32: { public: 0x0488b21e; private: 0x0488ade4 };
    wif: 0x80;

    constructor() {
        this.bip32 = { public: 0x0488b21e, private: 0x0488ade4 };
        this.wif = 0x80;
    }
}

// Classes for the Connection to the MainNet
export class Account extends WalletAccount {
  constructor (hdNode: WalletEllipticPair, readonly provider: AccountProvider) {
    super(hdNode, provider.network)
  }

  async isActive (): Promise<boolean> {
    const address = await this.getAddress()
    return this.provider.addresses.includes(address)
  }
}

export class AccountProvider implements WalletAccountProvider<Account> {
  public network: Network = MainNet

  constructor (public readonly addresses: string[]) {
  }

  provide (hdNode: WalletEllipticPair): Account {
    return new Account(hdNode, this)
  }
}

// Constants
const COINTYPE = 1129;
const PURPOSE = 0;

var options = new Options();
var account = new AccountProvider([]);

// Welcome

const welcomeText = `
Extract private keys from defichain mnemonic seed

------------------------------------------------------------------------------------
This is a small script with which you can extract the private keys of your addresses
from the mnemonic seed of the defichain lightwallet.
This script uses the official libraries of the defichain developers for the
calculation of the private keys.

It does not store any data on your system nor does it send any data. 
The script should be used offline

Be careful when using this script. 
If your computer is compromised, disclosing the private keys could lead to a
total loss of your coins.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND
------------------------------------------------------------------------------------
`
console.log(welcomeText)

// 1. Generate new mnemonic seed || 2. Use own mnemonic seed
const mnemonicWordsText = `
1. Generate new mnemonic seed
2. Use own mnemonic seed
`
console.log(mnemonicWordsText)
const mnemonicWordsPrompt = prompt('Type Number: ');

var seed: string[]

if (mnemonicWordsPrompt == "1") {
    seed = generateMnemonicWords(24)
    console.log("\nGenerated seed: \n")
    console.log(seed)
} else if(mnemonicWordsPrompt == "2") {
    console.log("\nType your mnemonic seed word by word separated by one space:\n")
    while (true) {
        const mnemonicWordsPrompt = prompt('Type mnemonic seed: ');
        seed = mnemonicWordsPrompt.split(" ")
        if(validateMnemonicSentence(seed)) break
        console.log("\nMnemonic seed is not valid, try again\n")
    }   
} else {
    console.log("\nTyped entry does not exist. Try again.")
    process.exit(0)
}

// How many addresses to explore
const numberOfAddressesText = `
How many addresses do you want to explore and get the private keys of?
1: refers to the first address in your lightwallet
If you type 10 you get the private keys to the first 10 addresses in your lightwallet
`

console.log(numberOfAddressesText)

const numberOfAddressesPrompt = prompt('Type number: ');
const numberOfAddresses = Number(numberOfAddressesPrompt)

if(isNaN(numberOfAddresses)) {
    console.log("\nYou did not type a number. Try again.\n") 
    process.exit(0)
}

// Setup Wallet
var wallet = MnemonicHdNodeProvider.fromWords(seed, options);
var jelly = new JellyfishWallet(wallet, account, COINTYPE, PURPOSE);

// Iterate through path, addresses and private keys and print them

console.log("\n--------------------------------------------------------------------")
for(var i = 0; i < numberOfAddresses; i++) {
    function path(n: number) {
        console.log("Path: 1129/0/0/" + i)
    }
    
    function address(n: number) {
        jelly.get(n).getAddress().then((address) => {
            console.log(n+1 + ". Address: " + address)
        })
    }
    function privateKey(n: number) {
        jelly.get(n).privateKey().then((key) => {
            var privateKey = WIF.encode(0x80, key)  
            console.log(n+1 + ". PrivateKey: " + privateKey)
            console.log("--------------------------------------------------------------------")
        })
    }
    address(i)
    privateKey(i)
}
