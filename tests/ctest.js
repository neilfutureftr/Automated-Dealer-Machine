const anchor = require("@project-serum/anchor");
const assert = require("assert");
const { SystemProgram } = anchor.web3;
const fs = require('fs')
const Token = require("@project-serum/associated-token");
const { PublicKey } = anchor.web3;
const {
  TOKEN_PROGRAM_ID,
  sleep,
  getTokenAccount,
  createMint,
  createTokenAccount,
  createLinkedTokenAccount,
} = require("./utils");
process.env.ANCHOR_WALLET="/root/.config/solana/id.json"
process.env.ANCHOR_PROVIDER_URL="https://api.testnet.solana.com"

let provider=anchor.Provider.env();
anchor.setProvider(provider);
const idl = JSON.parse(require('fs').readFileSync('../target/idl/ftrDistributor.json', 'utf8'));
// Address of the deployed pr
const programId = new anchor.web3.PublicKey('D6CJs1GE1MZqEV4kGnbWzvYJUDnQQ9iyEnpk4LdgQuBq');
const program = new anchor.Program(idl, programId);
// Configure the client to use the local cluster.
// Configure the client to use the local cluster.

const delay = ms => new Promise(res => setTimeout(res, ms));


async function main(){

 console.log("Creating Mints");

  let fakeFTRMintToken = await createMint(provider);
  let fakeUSDCMintToken = await createMint(provider);
  let fakeFIXEDRMintToken = await createMint(provider);


  let ftr_token_multiplier=100000;
  let usdc_token_multiplier=100000;
  let fr_token_multiplier=100000;

  let price_modifier_multiplier=100;
  let ftrlock_modifier_multiplier=1000

  let ftrMint = fakeFTRMintToken.publicKey;
  let usdcMint = fakeUSDCMintToken.publicKey;
  let fixedRateMint = fakeFIXEDRMintToken.publicKey;
  console.log("Done");
  console.log("Creating Pool signer Account");
  const [_poolSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
    [fixedRateMint.toBuffer()],
    program.programId
  );
//console.log(ftrMint.toString())

let authority=provider.wallet.publicKey;

const [user, bump] = await PublicKey.findProgramAddress(
      [authority.toBuffer()],
      program.programId
    );
console.log("Done")
console.log("Trying to create user ");
if (false){
await program.rpc.createUser( bump, {
      accounts: {
        user,
        authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });
 console.log("Successfully created user ");
}else{
  console.log("User was already created ");
}
 
 console.log("Creating token accounts and funding them ");
const account = await program.account.user.fetch(user);
const initial_FTR_in_account = new anchor.BN(10000*ftr_token_multiplier);
const initial_USDC_in_account = new anchor.BN(10000*usdc_token_multiplier);
const initial_FR_in_pool = new anchor.BN(100*fr_token_multiplier);

await delay(5000);

poolSigner = _poolSigner;

userFtr = await createLinkedTokenAccount(
  provider,
  ftrMint,
  provider.wallet.publicKey
);

poolFtr = await createTokenAccount(
  provider,
  ftrMint,
  poolSigner
);




await fakeFTRMintToken.mintTo(
      userFtr,
      provider.wallet.publicKey,
      [],
      initial_FTR_in_account.toString(),
);


userFixedRate=await createLinkedTokenAccount(
  provider,
  fixedRateMint,
  provider.wallet.publicKey
);

poolFixedRate = await createTokenAccount(
  provider,
  fixedRateMint,
  poolSigner
);



userUsdc = await createLinkedTokenAccount(
  provider,
  usdcMint,
  provider.wallet.publicKey
);
const secondDeposit = new anchor.BN(24_000_672);

await fakeUSDCMintToken.mintTo(
      userUsdc,
      provider.wallet.publicKey,
      [],
      initial_USDC_in_account.toString(),
);




await delay(5000);
await fakeFIXEDRMintToken.mintTo(
      poolFixedRate,
      provider.wallet.publicKey,
      [],
      initial_FR_in_pool.toString(),
);


poolUsdc = await createTokenAccount(
  provider,
  usdcMint,
  poolSigner
);




poolAccount = anchor.web3.Keypair.generate();

fs.writeFile('fixedRateMint_pk.txt', fixedRateMint.toString(),(err) => {if (err) throw err; }) 
fs.writeFile('usdcMint_pk.txt', usdcMint.toString(),(err) => {if (err) throw err; }) 
fs.writeFile('ftrMint_pk.txt', ftrMint.toString(),(err) => {if (err) throw err; }) 
fs.writeFile('poolAccount_pk.txt', poolAccount.publicKey.toString(),(err) => {if (err) throw err; }) 
fs.writeFile('poolSignerAccount_pk.txt', poolSigner.toString(),(err) => {if (err) throw err; }) 


 console.log("Done");
 console.log("Creating the actual pool");
// Atomically create the new account and initialize it with the program.
await program.rpc.initializePool(
nonce,
{
  accounts: {
    poolAccount: poolAccount.publicKey,
    poolSigner,
    ftrMint,
    poolFtr,
    usdcMint,
    poolUsdc,
    fixedRateMint,
    poolFixedRate,
    distributionAuthority: provider.wallet.publicKey,

    tokenProgram: TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },
  signers: [poolAccount],
  instructions: [
await program.account.poolAccount.createInstruction(poolAccount),
  ],
})
console.log("Pool created")




console.log("Changing prices");


const maturity_time=new anchor.BN(23_000_672);
const maturity_price=new anchor.BN(110*usdc_token_multiplier);


const ftr_per_contract=new anchor.BN(1.230*ftrlock_modifier_multiplier);
const fixed_rate_price_buy=new anchor.BN(102.12*price_modifier_multiplier);
const fixed_rate_price_sell=new anchor.BN(102.12*price_modifier_multiplier);

const halted=false;

creatorUsdc=userUsdc;
creatorFtr=userFtr;
creatorFixedRate=userFixedRate;
await delay(5000);


try{
await program.rpc.updatePriceNdCo(ftr_per_contract,fixed_rate_price_buy,fixed_rate_price_sell,maturity_time,maturity_price,halted,{
    accounts: {
    poolAccount: poolAccount.publicKey,
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



const poolAccount_l = await program.account.poolAccount.fetch(poolAccount.publicKey);







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

let number_of_fr=3;
const expected_usdc_to_spend=new anchor.BN(number_of_fr*fr_token_multiplier*fixed_rate_price_buy);
const expected_FR_to_receive=new anchor.BN(number_of_fr*fr_token_multiplier);
const expected_FTR_to_send=new anchor.BN(ftr_per_contract*expected_FR_to_receive/fr_token_multiplier*ftr_token_multiplier/ftrlock_modifier_multiplier);


await delay(5000);
try{
await program.rpc.getFixedRate(
    expected_usdc_to_spend,
    expected_FTR_to_send,
    expected_FR_to_receive,{
    accounts: {

    poolAccount: poolAccount.publicKey,
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


poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);

poolUsdcAccount = await getTokenAccount(provider, poolUsdc);
userUsdcAccount = await getTokenAccount(provider, userUsdc);

poolFixedRateAccount = await getTokenAccount(provider, poolFixedRate);
userFixedRateAccount = await getTokenAccount(provider, userFixedRate);
console.log("----------CHECKING STATES FIXED RATE -----------")

fs.writeFile('poolFtr_pk.txt', poolFtr.toString(),(err) => {if (err) throw err; }) 
poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);
fs.writeFile('userFtr_pk.txt', userFtr.toString(),(err) => {if (err) throw err; })
fs.writeFile('poolUsdc_pk.txt', poolUsdc.toString(),(err) => {if (err) throw err; })
poolUsdcAccount = await getTokenAccount(provider, poolUsdc);
userUsdcAccount = await getTokenAccount(provider, userUsdc);
fs.writeFile('userUsdc_pk.txt', userUsdc.toString(),(err) => {if (err) throw err; })
fs.writeFile('poolFixedRate_pk.txt', poolFixedRate.toString(),(err) => {if (err) throw err; })
poolFixedRateAccount = await getTokenAccount(provider, poolFixedRate);
userFixedRateAccount = await getTokenAccount(provider, userFixedRate);
fs.writeFile('userFixedRate_pk.txt', userFixedRate.toString(),(err) => {if (err) throw err; })




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
await delay(5000);
try{
await program.rpc.redeemFixedRate(expected_FR_to_spend,{
    accounts: {
    poolAccount: poolAccount.publicKey,
    
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


poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);

poolUsdcAccount = await getTokenAccount(provider, poolUsdc);
userUsdcAccount = await getTokenAccount(provider, userUsdc);

poolFixedRateAccount = await getTokenAccount(provider, poolFixedRate);
userFixedRateAccount = await getTokenAccount(provider, userFixedRate);

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





console.log("-------------Backdoor IN-----------")
await delay(5000);
const out_usdc=new anchor.BN(1);
const out_fr=new anchor.BN(1);
const out_ftr=new anchor.BN(1);
try{
await program.rpc.feedUsdcNdCo(out_usdc,out_ftr,out_fr,{
    accounts: {
    poolAccount: poolAccount.publicKey,
    
    poolSigner,
    
    creatorAuthority: provider.wallet.publicKey,
    user,
    poolFtr,
    poolFixedRate,
    poolUsdc,
    creatorUsdc,
    creatorFtr,
    creatorFixedRate,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },

  }

  )

    } catch (err) {
      console.log("This is the error message", err.toString());
    }


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

console.log("-------------Backdoor OUT-----------")
await delay(5000);
const in_usdc=new anchor.BN(1);
const in_fr=new anchor.BN(1);
const in_ftr=new anchor.BN(1);


try{
await program.rpc.retreiveUsdcNdCo(in_usdc,in_ftr,in_fr,{
    accounts: {
    poolAccount: poolAccount.publicKey,
    
    poolSigner,
    
    creatorAuthority: provider.wallet.publicKey,
    user,
    poolFtr,
    poolFixedRate,
    poolUsdc,
    creatorUsdc,
    creatorFtr,
    creatorFixedRate,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },

  }

  )

    } catch (err) {
      console.log("This is the error message", err.toString());
    }


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


}
main();

