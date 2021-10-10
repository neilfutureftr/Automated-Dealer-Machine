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

// Address of the deployed pr
const programId = new anchor.web3.PublicKey('D6CJs1GE1MZqEV4kGnbWzvYJUDnQQ9iyEnpk4LdgQuBq');
const program = new anchor.Program(idl, programId);



async function main(){

  let ftr_token_multiplier=100000;
  let usdc_token_multiplier=100000;
  let fr_token_multiplier=100000;
  let price_modifier_multiplier=100;



  const pk_ftrMint=new anchor.web3.PublicKey(require('fs').readFileSync('ftrMint_pk.txt', 'utf8'));
  const pk_usdMint=new anchor.web3.PublicKey(require('fs').readFileSync('usdcMint_pk.txt', 'utf8'));
  const pk_fixedRateMint=new anchor.web3.PublicKey(require('fs').readFileSync('fixedRateMint_pk.txt', 'utf8'));
  
if (false){
  const pk_poolUsdc=new anchor.web3.PublicKey(require('fs').readFileSync('poolUsdc_pk.txt', 'utf8'));
  const pk_poolFtr=new anchor.web3.PublicKey(require('fs').readFileSync('poolFtr_pk.txt', 'utf8'));
  const pk_poolFixedRate=new anchor.web3.PublicKey(require('fs').readFileSync('poolFixedRate_pk.txt', 'utf8'));


  const pk_userUsdc = await Token.getAssociatedTokenAddress(provider.wallet.publicKey, pk_ftrMint);
  const pk_userFtr = await Token.getAssociatedTokenAddress(provider.wallet.publicKey, pk_usdMint);
  const pk_userFixedRate = await Token.getAssociatedTokenAddress(provider.wallet.publicKey, pk_fixedRateMint);
}  
  const pk_poolAccount=new anchor.web3.PublicKey(require('fs').readFileSync('poolAccount_pk.txt', 'utf8'));
  const pk_poolSignerAccount=new anchor.web3.PublicKey(require('fs').readFileSync('poolSignerAccount_pk.txt', 'utf8'));



    const pk_userUsdc=new anchor.web3.PublicKey(require('fs').readFileSync('userUsdc_pk.txt', 'utf8'));
    const pk_poolUsdc=new anchor.web3.PublicKey(require('fs').readFileSync('poolUsdc_pk.txt', 'utf8'));
    const pk_userFtr=new anchor.web3.PublicKey(require('fs').readFileSync('userFtr_pk.txt', 'utf8'));
    const pk_poolFtr=new anchor.web3.PublicKey(require('fs').readFileSync('poolFtr_pk.txt', 'utf8'));
    const pk_userFixedRate=new anchor.web3.PublicKey(require('fs').readFileSync('userFixedRate_pk.txt', 'utf8'));
    const pk_poolFixedRate=new anchor.web3.PublicKey(require('fs').readFileSync('poolFixedRate_pk.txt', 'utf8'));



  if (false){
    const pk_userUsdc=new anchor.web3.PublicKey(require('fs').readFileSync('userUsdc_pk.txt', 'utf8'));
    const pk_poolUsdc=new anchor.web3.PublicKey(require('fs').readFileSync('poolUsdc_pk.txt', 'utf8'));
    const pk_userFtr=new anchor.web3.PublicKey(require('fs').readFileSync('userFtr_pk.txt', 'utf8'));
    const pk_poolFtr=new anchor.web3.PublicKey(require('fs').readFileSync('poolFtr_pk.txt', 'utf8'));
    const pk_userFixedRate=new anchor.web3.PublicKey(require('fs').readFileSync('userFixedRate_pk.txt', 'utf8'));
    const pk_poolFixedRate=new anchor.web3.PublicKey(require('fs').readFileSync('poolFixedRate_pk.txt', 'utf8'));


  }
  let ftrMint = pk_ftrMint;
  let usdcMint = pk_usdMint;

  let fixedRateMint = pk_fixedRateMint;
  let poolAccountPK= pk_poolAccount;


if(false){
  poolFtr = await Token.getAssociatedTokenAddress(pk_poolSignerAccount, pk_ftrMint);

  poolUsdc = await Token.getAssociatedTokenAddress(pk_poolSignerAccount, pk_usdMint);

  poolFixedRate = await Token.getAssociatedTokenAddress(pk_poolSignerAccount, pk_fixedRateMint);
  console.log("Final_check")
}



  poolFtr = pk_poolFtr
  userFtr = pk_userFtr
  poolUsdc = pk_poolUsdc
  userUsdc = pk_userUsdc
  poolFixedRate = pk_poolFixedRate
  userFixedRate = pk_userFixedRate





let authority=provider.wallet.publicKey;

const [user, bump] = await PublicKey.findProgramAddress(
      [authority.toBuffer()],
      program.programId
    );

  const [_poolSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
    [fixedRateMint.toBuffer()],
    program.programId
  );
 poolSigner=_poolSigner;

const account = await program.account.user.fetch(user);

console.log("Done reloading stuff")

const initial_FTR_in_account = new anchor.BN(100);
const initial_USDC_in_account = new anchor.BN(1_000);
const initial_FR_in_pool = new anchor.BN(100);





console.log("Changing prices");


const maturity_time=new anchor.BN(23_000_672);
const maturity_price=new anchor.BN(23_000_672);


const ftr_per_contract=new anchor.BN(1.7);
const fixed_rate_price_buy=new anchor.BN(102*usdc_token_multiplier/price_modifier_multiplier);
const fixed_rate_price_sell=new anchor.BN(102*usdc_token_multiplier/price_modifier_multiplier);
const halted=false;



creatorUsdc=userUsdc;
creatorFtr=userFtr;
creatorFixedRate=userFixedRate;



try{
await program.rpc.updatePriceNdCo(ftr_per_contract,fixed_rate_price_buy,fixed_rate_price_sell,maturity_time,maturity_price,halted,{
    accounts: {
    poolAccount: poolAccountPK,
    creatorAuthority: provider.wallet.publicKey,
    poolSigner,
    user,

    poolUsdc,
    poolFtr,
    poolFixedRate,
    creatorUsdc,
    creatorFtr,
    creatorFixedRate,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },

  }

  )
  console.log("Updating prices succeed");
    } catch (err) {
      console.log("This is the error message", err.toString());
    }


const poolAccount_l = await program.account.poolAccount.fetch(poolAccountPK);





poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);

poolUsdcAccount = await getTokenAccount(provider, poolUsdc);
userUsdcAccount = await getTokenAccount(provider, userUsdc);

poolFixedRateAccount = await getTokenAccount(provider, poolFixedRate);
userFixedRateAccount = await getTokenAccount(provider, userFixedRate);

console.log("USDC in the USDC pool")
console.log((poolUsdcAccount.amount/usdc_token_multiplier).toString());
console.log("FTR in the FTR pool")
console.log((poolFtrAccount.amount/ftr_token_multiplier).toString());
console.log("FixedRate in the FixedRate pool")
console.log((poolFixedRateAccount.amount/ftr_token_multiplier).toString());

console.log("USDC in the user USDC wallet")
console.log((userUsdcAccount.amount/usdc_token_multiplier).toString())
console.log("FTR in the user FTR wallet")
console.log((userFtrAccount.amount/ftr_token_multiplier).toString())
console.log("FixedRate in the user FixedRate wallet")
console.log((userFixedRateAccount.amount/fr_token_multiplier).toString())



console.log("----------PURCHASING 1.2 FIXED RATE -----------")
let number_of_fr=1;
const expected_usdc_to_spend=new anchor.BN(number_of_fr*fr_token_multiplier/price_modifier_multiplier*fixed_rate_price_buy);
const expected_FR_to_receive=new anchor.BN(number_of_fr*fr_token_multiplier/price_modifier_multiplier);
const expected_FTR_to_send=new anchor.BN(ftr_per_contract*expected_FR_to_receive/fr_token_multiplier*ftr_token_multiplier);

try{
await program.rpc.getFixedRate(
    expected_usdc_to_spend,
    expected_FTR_to_send,
    expected_FR_to_receive,{
    accounts: {

    poolAccount: poolAccountPK,
    userAuthority: provider.wallet.publicKey,
    poolSigner,
    user,

    poolUsdc,
    poolFtr,
    poolFixedRate,
    userUsdc,
    userFtr,
    userFixedRate,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },

  }

  )

    } catch (err) {
      console.log("This is the error message", err.toString());
    }
poolFtrAccount = await getTokenAccount(provider, pk_poolFtr);
userFtrAccount = await getTokenAccount(provider, pk_userFtr);

poolUsdcAccount = await getTokenAccount(provider, pk_poolUsdc);
userUsdcAccount = await getTokenAccount(provider, pk_userUsdc);

poolFixedRateAccount = await getTokenAccount(provider, pk_poolFixedRate);
userFixedRateAccount = await getTokenAccount(provider, pk_userFixedRate);

console.log("----------CHECKING STATES FIXED RATE -----------")

console.log("USDC in the USDC pool")
console.log((poolUsdcAccount.amount/usdc_token_multiplier).toString());
console.log("FTR in the FTR pool")
console.log((poolFtrAccount.amount/ftr_token_multiplier).toString());
console.log("FixedRate in the FixedRate pool")
console.log((poolFixedRateAccount.amount/ftr_token_multiplier).toString());

console.log("USDC in the user USDC wallet")
console.log((userUsdcAccount.amount/usdc_token_multiplier).toString())
console.log("FTR in the user FTR wallet")
console.log((userFtrAccount.amount/ftr_token_multiplier).toString())
console.log("FixedRate in the user FixedRate wallet")
console.log((userFixedRateAccount.amount/fr_token_multiplier).toString())


const number_of_contract_to_redeem = 1;

const expected_FR_to_spend=new anchor.BN(number_of_contract_to_redeem*fr_token_multiplier/price_modifier_multiplier);

console.log("-------------Redeeming Fixed Rate-----------")


try{
await program.rpc.redeemFixedRate(expected_FR_to_spend,{
    accounts: {
    poolAccount: poolAccountPK,
    
    poolSigner,
    
    userAuthority: provider.wallet.publicKey,
    user,
    poolFtr,
    poolFixedRate,
    poolUsdc,
    userFtr,
    userUsdc,
    userFixedRate,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },

  }

  )

    } catch (err) {
      console.log("This is the error message", err.toString());
    }
poolFtrAccount = await getTokenAccount(provider, pk_poolFtr);
userFtrAccount = await getTokenAccount(provider, pk_userFtr);

poolUsdcAccount = await getTokenAccount(provider, pk_poolUsdc);
userUsdcAccount = await getTokenAccount(provider, pk_userUsdc);

poolFixedRateAccount = await getTokenAccount(provider, pk_poolFixedRate);
userFixedRateAccount = await getTokenAccount(provider, pk_userFixedRate);

console.log("----------CHECKING STATES FIXED RATE -----------")

console.log("USDC in the USDC pool")
console.log((poolUsdcAccount.amount/usdc_token_multiplier).toString());
console.log("FTR in the FTR pool")
console.log((poolFtrAccount.amount/ftr_token_multiplier).toString());
console.log("FixedRate in the FixedRate pool")
console.log((poolFixedRateAccount.amount/ftr_token_multiplier).toString());

console.log("USDC in the user USDC wallet")
console.log((userUsdcAccount.amount/usdc_token_multiplier).toString())
console.log("FTR in the user FTR wallet")
console.log((userFtrAccount.amount/ftr_token_multiplier).toString())
console.log("FixedRate in the user FixedRate wallet")
console.log((userFixedRateAccount.amount/fr_token_multiplier).toString())





}
main();

