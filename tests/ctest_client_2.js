const anchor = require("@project-serum/anchor");

const Token = require("@project-serum/associated-token");
const assert = require("assert");
const { SystemProgram } = anchor.web3;
const { PublicKey } = anchor.web3;

const {
  TOKEN_PROGRAM_ID,
  sleep,
  getTokenAccount,
  createMint,
  createTokenAccount,
} = require("./utils");
process.env.ANCHOR_WALLET="/root/.config/solana/id.json"
process.env.ANCHOR_PROVIDER_URL="https://api.testnet.solana.com"

let provider=anchor.Provider.env();
anchor.setProvider(provider);
const idl = JSON.parse(require('fs').readFileSync('../target/idl/ftrDistributor.json', 'utf8'));
const pk_userUsdc=new anchor.web3.PublicKey(require('fs').readFileSync('userUsdc_pk.txt', 'utf8'));
const pk_poolUsdc=new anchor.web3.PublicKey(require('fs').readFileSync('poolUsdc_pk.txt', 'utf8'));
const pk_userFtr=new anchor.web3.PublicKey(require('fs').readFileSync('userFtr_pk.txt', 'utf8'));
const pk_poolFtr=new anchor.web3.PublicKey(require('fs').readFileSync('poolFtr_pk.txt', 'utf8'));
const pk_userFixedRate=new anchor.web3.PublicKey(require('fs').readFileSync('userFixedRate_pk.txt', 'utf8'));
const pk_poolFixedRate=new anchor.web3.PublicKey(require('fs').readFileSync('poolFixedRate_pk.txt', 'utf8'));

// Address of the deployed pr
const programId = new anchor.web3.PublicKey('D6CJs1GE1MZqEV4kGnbWzvYJUDnQQ9iyEnpk4LdgQuBq');
const program = new anchor.Program(idl, programId);
// Configure the client to use the local cluster.
// Configure the client to use the local cluster.



async function main(){


const secondDepositf = new anchor.BN(24_000_672);
const secondDeposit = new anchor.BN(20 * 1e6);
console.log(secondDepositf.toString())
console.log(secondDeposit.toString())
}
main();

