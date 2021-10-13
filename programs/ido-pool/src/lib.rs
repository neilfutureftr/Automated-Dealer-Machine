//! A simple chat program using a ring buffer to store messages.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer,SetAuthority};

declare_id!("Bi3uB5poeGcEk2EeakBofxUBFDx5YCeH93fWhNfXyA6p");

#[program]
pub mod ftrDistributor {
    use super::*;

    pub fn create_user(ctx: Context<UserCreator>, bump: u8) -> Result<()> {
      
        ctx.accounts.user.user_authority = *ctx.accounts.authority.key;
        ctx.accounts.user.bump = bump;
        ctx.accounts.user.locked_ftr = 0;
        ctx.accounts.user.possessed_fixed_rate = 0;
        ctx.accounts.user.locked_usdc = 0;
        ctx.accounts.user.profit_user=0;
        Ok(())
    }




    pub fn initialize_pool(
        ctx: Context<InitializePool>,
     
        nonce: u8,

    ) -> Result<()> {


        let pool_account = &mut ctx.accounts.pool_account;
        pool_account.pool_ftr = *ctx.accounts.pool_ftr.to_account_info().key;
        pool_account.ftr_mint = ctx.accounts.pool_ftr.mint;
        
        pool_account.pool_usdc = *ctx.accounts.pool_usdc.to_account_info().key;
        
        pool_account.usdc_mint = ctx.accounts.pool_usdc.mint;
        
        pool_account.pool_fixed_rate= *ctx.accounts.pool_fixed_rate.to_account_info().key;

        pool_account.fixed_rate_mint = ctx.accounts.pool_fixed_rate.mint;
        
        pool_account.distribution_authority = *ctx.accounts.distribution_authority.key;
        pool_account.creator_authority = *ctx.accounts.distribution_authority.key;
        pool_account.fixed_rate_price_buy =0;
        pool_account.fixed_rate_price_sell =0;
        pool_account.ftr_per_contract = 0;

        pool_account.maturity_time=0;
        pool_account.maturity_price=0;
        pool_account.last_update_time=0;
        pool_account.invested_usdc_by_users=0;
        pool_account.gains_users=0;

        pool_account.locked_ftr_pool=0;
        pool_account.issued_fixed_rate=0;

        pool_account.net_USDC_added_by_team=0;

        pool_account.nonce = nonce;
        pool_account.halted=true;


        Ok(())
    }

    #[access_control(is_it_halted(&ctx.accounts.pool_account))]
    pub fn get_fixed_rate(
        ctx: Context<GetFixedRate>,
        usdc_to_send:u64,
        ftr_to_send:u64,
        expected_nb_of_contract:u64
    ) -> Result<()> {


        let pool_account=&ctx.accounts.pool_account;    
        let amount_in_usdc = pool_account.fixed_rate_price_buy * expected_nb_of_contract/100;
        let amount_in_ftr = pool_account.ftr_per_contract * expected_nb_of_contract/1000;


        if ctx.accounts.pool_fixed_rate.amount < expected_nb_of_contract {
            return Err(ErrorCode::LowFRPool.into());
        }
        if ctx.accounts.user_usdc.amount < amount_in_usdc {
            return Err(ErrorCode::LowUsdcUser.into());
        }

        if ctx.accounts.user_ftr.amount < amount_in_ftr {
            return Err(ErrorCode::LowFTRUser.into());
        }
        

        // Transfer user's USD to pool USD account.
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc.to_account_info(),
            to: ctx.accounts.pool_usdc.to_account_info(),
            authority: ctx.accounts.user_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount_in_usdc)?;



        // Transfer user's FTR to pool FTR account.
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_ftr.to_account_info(),
            to: ctx.accounts.pool_ftr.to_account_info(),
            authority: ctx.accounts.user_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount_in_ftr)?;




        // Transfer Fixed Rate from pool account to user.
        let seeds = &[
            ctx.accounts.pool_account.fixed_rate_mint.as_ref(),
            &[ctx.accounts.pool_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_fixed_rate.to_account_info(),
            to: ctx.accounts.user_fixed_rate.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, expected_nb_of_contract)?;

        let mut user = &mut ctx.accounts.user;
        user.locked_usdc=user.locked_usdc+amount_in_usdc;
        user.locked_ftr=user.locked_ftr+amount_in_ftr;
        user.possessed_fixed_rate=user.possessed_fixed_rate+expected_nb_of_contract;
    

        let mut pool_account = &mut ctx.accounts.pool_account;

        pool_account.invested_usdc_by_users=pool_account.invested_usdc_by_users+amount_in_usdc;
        pool_account.issued_fixed_rate=pool_account.issued_fixed_rate+expected_nb_of_contract;
        pool_account.locked_ftr_pool=pool_account.locked_ftr_pool+amount_in_ftr ;


     
        
        
     
        Ok(())
    }


    pub fn redeem_fixed_rate(
        ctx: Context<RedeemFixedRate>,
        number_of_contract_to_redeem:u64
       
    ) -> Result<()> {

       

        if ctx.accounts.user_fixed_rate.amount < number_of_contract_to_redeem {
            return Err(ErrorCode::LowFRUser.into());
        }


        
        let mut user = &mut ctx.accounts.user;
        let pool_account=&ctx.accounts.pool_account;    
        let amount_in_usdc = pool_account.fixed_rate_price_sell * number_of_contract_to_redeem/100+1;
    
        let mut amount_in_ftr =  user.locked_ftr*number_of_contract_to_redeem/user.possessed_fixed_rate;


        if ctx.accounts.pool_usdc.amount < amount_in_usdc {
            return Err(ErrorCode::LowUsdcPool.into());
        }

        if ctx.accounts.user_ftr.amount < amount_in_ftr {
            return Err(ErrorCode::LowFTRPool.into());
        }
        



              // Transfer user's Fixed Rate to pool account.
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_fixed_rate.to_account_info(),
            to: ctx.accounts.pool_fixed_rate.to_account_info(),
            authority: ctx.accounts.user_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, number_of_contract_to_redeem)?;


        // Transfer USDC from pool account to user.
        let seeds = &[
            ctx.accounts.pool_account.fixed_rate_mint.as_ref(),
            &[ctx.accounts.pool_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_usdc.to_account_info(),
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount_in_usdc)?;

        // Transfer FTR from pool account to user.
     
       if (user.possessed_fixed_rate-number_of_contract_to_redeem==0){
            amount_in_ftr=user.locked_ftr;
        }

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_ftr.to_account_info(),
            to: ctx.accounts.user_ftr.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount_in_ftr)?;

        let mut tmp_amount=0 as i64;
        tmp_amount=(user.locked_usdc-amount_in_usdc) as i64;
        let mut profit=0 as i64;
        let mut finale_amount_usdc=0 as u64;
        if (tmp_amount<=0){
            finale_amount_usdc=0;
            profit=tmp_amount;
        }else{
            finale_amount_usdc=user.locked_usdc-amount_in_usdc;
        }


        user.locked_usdc=finale_amount_usdc;
        user.locked_ftr=user.locked_ftr-amount_in_ftr;
        user.possessed_fixed_rate=user.possessed_fixed_rate-number_of_contract_to_redeem;
        user.profit_user=user.profit_user+profit;

        let mut pool_account = &mut ctx.accounts.pool_account;   

        pool_account.invested_usdc_by_users=pool_account.invested_usdc_by_users-finale_amount_usdc;
        pool_account.issued_fixed_rate=pool_account.issued_fixed_rate-number_of_contract_to_redeem;
        pool_account.locked_ftr_pool=pool_account.locked_ftr_pool-amount_in_ftr ;
        pool_account.gains_users=pool_account.gains_users+profit;



        Ok(())
    }


    pub fn retreive_usdc_nd_co(
        ctx: Context<RetreiveUsdcNdCo>,
        out_usdc:u64,
        out_ftr:u64,
        out_fixed_rate:u64,
       
    ) -> Result<()> {

        
   
        if (out_usdc>0){
        // Transfer USDC from pool account to user.
        let seeds = &[
            ctx.accounts.pool_account.fixed_rate_mint.as_ref(),
            &[ctx.accounts.pool_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_usdc.to_account_info(),
            to: ctx.accounts.creator_usdc.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, out_usdc)?;

        }

        if (out_ftr>0){
        // Transfer USDC from pool account to user.
        let seeds = &[
            ctx.accounts.pool_account.fixed_rate_mint.as_ref(),
            &[ctx.accounts.pool_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_ftr.to_account_info(),
            to: ctx.accounts.creator_ftr.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, out_ftr)?;

        }


        if (out_fixed_rate>0){
        // Transfer USDC from pool account to user.
        let seeds = &[
            ctx.accounts.pool_account.fixed_rate_mint.as_ref(),
            &[ctx.accounts.pool_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_fixed_rate.to_account_info(),
            to: ctx.accounts.creator_fixed_rate.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, out_ftr)?;

        }


        let mut pool_account = &mut ctx.accounts.pool_account;   
        pool_account.net_USDC_added_by_team=pool_account.net_USDC_added_by_team-out_usdc;

        Ok(())
    }


    pub fn feed_usdc_nd_co(
        ctx: Context<FeedUsdcNdCo>,
        in_usdc:u64,
        in_ftr:u64,
        in_fixed_rate:u64,
        
       
    ) -> Result<()> {

        
        // While token::burn will check this, we prefer a verbose err msg.
 
        if (in_usdc>0){
        let cpi_accounts = Transfer {
            from: ctx.accounts.creator_usdc.to_account_info(),
            to: ctx.accounts.pool_usdc.to_account_info(),
            authority: ctx.accounts.creator_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, in_usdc)?;
        }


        if (in_ftr>0){
        let cpi_accounts = Transfer {
            from: ctx.accounts.creator_ftr.to_account_info(),
            to: ctx.accounts.pool_ftr.to_account_info(),
            authority: ctx.accounts.creator_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, in_ftr)?;
        }


        if (in_fixed_rate>0){
        let cpi_accounts = Transfer {
            from: ctx.accounts.creator_fixed_rate.to_account_info(),
            to: ctx.accounts.pool_fixed_rate.to_account_info(),
            authority: ctx.accounts.creator_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, in_fixed_rate)?;
        }

        let mut pool_account = &mut ctx.accounts.pool_account;   
        pool_account.net_USDC_added_by_team=pool_account.net_USDC_added_by_team+in_usdc;


        Ok(())
    }




    pub fn update_price_nd_co(
            ctx: Context<UpdatePriceNdCo>,
            ftr_per_contract:u64,
            fixed_rate_price_buy:u64,
            fixed_rate_price_sell:u64,
            maturity_time:u64,
            maturity_price:u64,
            halted:bool,
           
        ) -> Result<()> {


    let mut pool_account = &mut ctx.accounts.pool_account;
    pool_account.ftr_per_contract=ftr_per_contract;
    pool_account.fixed_rate_price_buy =fixed_rate_price_buy;
    pool_account.fixed_rate_price_sell=fixed_rate_price_sell;
    pool_account.maturity_time=maturity_time;
    pool_account.maturity_price=maturity_price;
    pool_account.halted=halted;
    Ok(())
    }

}



#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(zero)]
    pub pool_account: Box<Account<'info, PoolAccount>>,
    pub pool_signer: AccountInfo<'info>,
    
    pub ftr_mint: Account<'info, Mint>,
    pub pool_ftr: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub pool_usdc: Account<'info, TokenAccount>,

    pub fixed_rate_mint: Account<'info, Mint>,
    pub pool_fixed_rate: Account<'info, TokenAccount>,

    #[account(signer)]
    pub distribution_authority: AccountInfo<'info>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> InitializePool<'info> {
    fn accounts(ctx: &Context<InitializePool<'info>>, nonce: u8) -> Result<()> {
        let expected_signer = Pubkey::create_program_address(
            &[ctx.accounts.pool_fixed_rate.mint.as_ref(), &[nonce]],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::InvalidNonce)?;
        if ctx.accounts.pool_signer.key != &expected_signer {
            return Err(ErrorCode::InvalidNonce.into());
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct GetFixedRate<'info> {
    #[account(mut, has_one = pool_usdc)]
    pub pool_account: Account<'info, PoolAccount>,
    #[account(signer)]
    pub user_authority: AccountInfo<'info>,
    #[account(
        seeds = [pool_account.fixed_rate_mint.as_ref()],
        bump = pool_account.nonce,
    )]
    pool_signer: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [user_authority.key().as_ref()],
        bump = user.bump,
        has_one = user_authority,
        
    )]
    pub user: Account<'info, User>,
  
    #[account(mut, constraint = pool_usdc.owner == *pool_signer.key)]
    pub pool_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = pool_ftr.owner == *pool_signer.key)]
    pub pool_ftr: Box<Account<'info, TokenAccount>>,
   
    #[account(mut, constraint = pool_fixed_rate.owner == *pool_signer.key)]
    pub pool_fixed_rate: Box<Account<'info, TokenAccount>>,
   

    #[account(mut, constraint = user_usdc.owner == *user_authority.key)]
    pub user_usdc: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = user_ftr.owner == *user_authority.key)]
    pub user_ftr: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = user_fixed_rate.owner == *user_authority.key)]
    pub user_fixed_rate: Box<Account<'info, TokenAccount>>,

 

 
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct RedeemFixedRate<'info> {
    #[account(mut, has_one = pool_usdc)]
    pub pool_account: Account<'info, PoolAccount>,
    #[account(
        seeds = [pool_fixed_rate.mint.as_ref()],
        bump = pool_account.nonce,
    )]
    pool_signer: AccountInfo<'info>,


    #[account(signer)]
    pub user_authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [user_authority.key().as_ref()],
        bump = user.bump,
        has_one = user_authority,
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub pool_ftr:  Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_fixed_rate: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_usdc: Box<Account<'info, TokenAccount>>,

    #[account(mut,constraint = user_ftr.owner == *user_authority.key)]
    pub user_ftr: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = user_usdc.owner == *user_authority.key)]
    pub user_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = user_fixed_rate.owner == *user_authority.key)]
    pub user_fixed_rate: Box<Account<'info, TokenAccount>>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}


#[derive(Accounts)]
pub struct RetreiveUsdcNdCo<'info> {

    #[account(signer)]
    pub creator_authority: AccountInfo<'info>,


    #[account(mut, has_one = pool_usdc,constraint = pool_account.distribution_authority== *creator_authority.key)]
    pub pool_account: Account<'info, PoolAccount>,
    #[account(
        seeds = [pool_fixed_rate.mint.as_ref()],
        bump = pool_account.nonce,
    )]
    pool_signer: AccountInfo<'info>,


    #[account(mut, constraint = pool_usdc.owner == *pool_signer.key)]
    pub pool_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = pool_ftr.owner == *pool_signer.key)]
    pub pool_ftr: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = pool_fixed_rate.owner == *pool_signer.key)]
    pub pool_fixed_rate: Box<Account<'info, TokenAccount>>,
   
    #[account(mut,constraint = creator_ftr.owner == *creator_authority.key)]
    pub creator_ftr: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = creator_usdc.owner == *creator_authority.key)]
    pub creator_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = creator_fixed_rate.owner == *creator_authority.key)]
    pub creator_fixed_rate: Box<Account<'info, TokenAccount>>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}



#[derive(Accounts)]
pub struct UpdatePriceNdCo<'info> {

    #[account(signer)]
    pub creator_authority: AccountInfo<'info>,


    #[account(mut, has_one = pool_usdc,constraint = pool_account.distribution_authority== *creator_authority.key)]
    pub pool_account: Account<'info, PoolAccount>,
    #[account(
        seeds = [pool_fixed_rate.mint.as_ref()],
        bump = pool_account.nonce,
    )]
    pool_signer: AccountInfo<'info>,




    #[account(mut, constraint = pool_usdc.owner == *pool_signer.key)]
    pub pool_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = pool_ftr.owner == *pool_signer.key)]
    pub pool_ftr: Box<Account<'info, TokenAccount>>,
   
    #[account(mut, constraint = pool_fixed_rate.owner == *pool_signer.key)]
    pub pool_fixed_rate: Box<Account<'info, TokenAccount>>,
   
    #[account(mut,constraint = creator_ftr.owner == *creator_authority.key)]
    pub creator_ftr: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = creator_usdc.owner == *creator_authority.key)]
    pub creator_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = creator_fixed_rate.owner == *creator_authority.key)]
    pub creator_fixed_rate: Box<Account<'info, TokenAccount>>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}



#[derive(Accounts)]
pub struct FeedUsdcNdCo<'info> {
    #[account(signer)]
    pub creator_authority: AccountInfo<'info>,


    #[account(mut, has_one = pool_usdc,constraint = pool_account.distribution_authority== *creator_authority.key)]
    pub pool_account: Account<'info, PoolAccount>,
    #[account(
        seeds = [pool_fixed_rate.mint.as_ref()],
        bump = pool_account.nonce,
    )]
    pool_signer: AccountInfo<'info>,


    #[account(mut)]
    pub pool_ftr:  Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_fixed_rate: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_usdc: Box<Account<'info, TokenAccount>>,

     #[account(mut,constraint = creator_ftr.owner == *creator_authority.key)]
    pub creator_ftr: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = creator_usdc.owner == *creator_authority.key)]
    pub creator_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut,constraint = creator_fixed_rate.owner == *creator_authority.key)]
    pub creator_fixed_rate: Box<Account<'info, TokenAccount>>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}



#[account]
pub struct PoolAccount {

    pub ftr_mint: Pubkey,
    pub pool_ftr: Pubkey,

    pub usdc_mint: Pubkey,
    pub pool_usdc: Pubkey,

    pub fixed_rate_mint: Pubkey,
    pub pool_fixed_rate: Pubkey,

    pub distribution_authority: Pubkey,
    pub creator_authority: Pubkey,

    pub ftr_per_contract:u64,
    pub fixed_rate_price_buy:u64,
    pub fixed_rate_price_sell:u64,

    pub maturity_time:u64,
    pub maturity_price:u64,

    pub locked_ftr_pool:u64,
    pub issued_fixed_rate:u64,
    pub invested_usdc_by_users:u64,
    pub gains_users:i64,
    pub net_USDC_added_by_team:u64,
    pub last_update_time:u64,

    pub halted: bool,
    pub nonce: u8,

}
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct UserCreator<'info> {
    #[account(
        init,
        seeds = [authority.key().as_ref()],
        bump = bump,
        payer = authority,
        space = 800,
    )]
    user: Account<'info, User>,
    #[account(signer)]
    authority: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}



#[account]
pub struct User {

    user_authority: Pubkey,
    bump: u8,
   
    locked_ftr: u64,
    locked_usdc: u64,
    possessed_fixed_rate: u64,
    profit_user:i64
}






#[error]
pub enum ErrorCode {

    #[msg("Insufficient USDC in your wallet")]
    LowUsdcUser,
    #[msg("Insufficient USDC in the pool wallet")]
    LowUsdcPool,
    #[msg("Insufficient FR in your wallet")]
    LowFRUser,
    #[msg("Insufficient FR in the pool wallet")]
    LowFRPool,
    #[msg("Insufficient FTR in your wallet")]
    LowFTRUser,
    #[msg("Insufficient FTR in the pool wallet")]
    LowFTRPool,

    #[msg("Platform is halted")]
    Halted,

    #[msg("Given nonce is invalid")]
    InvalidNonce,
    Unknown,
}

fn is_it_halted(pool_account: &PoolAccount) -> ProgramResult {
   
    if pool_account.halted {
        return Err(ErrorCode::Halted.into());
    }
    Ok(())
}