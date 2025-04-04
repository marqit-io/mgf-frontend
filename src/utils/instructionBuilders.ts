import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress, NATIVE_MINT, createCloseAccountInstruction } from "@solana/spl-token";
import { BN, Idl, Program } from "@coral-xyz/anchor";
import { TickUtils, ApiV3PoolInfoConcentratedItem, WSOLMint, ComputeClmmPoolInfo, ReturnTypeFetchMultiplePoolTickArrays, CLMM_PROGRAM_ID as MAINNET_CLMM_PROGRAM_ID, DEVNET_PROGRAM_ID, PoolUtils } from "@raydium-io/raydium-sdk-v2";
import { DepositPositionParams, MetadataParams, TokenFeeParams } from "../types/instruction";
import { MgfMatrix as IDL } from "./idl";
import RaydiumService from './raydium';

const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
const mgfProgram = new Program(IDL as Idl, { connection });
const isDevnet = import.meta.env.VITE_CLUSTER === "devnet";

const EXECUTOR_PROGRAM_ID = new PublicKey(import.meta.env.VITE_EXECUTOR_PROGRAM_ID);
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const PLATFORM_FEE_ACCOUNT = isDevnet ? new PublicKey("mqtj8nemKcW1y3fQhBz6ENWNsiHGqZ5M3ySmefokEnJ") : new PublicKey("7j5bdSE2k4xcqvCEjK223CFTeDvLMPskXYJKj3ZgtPaL");
const POOL_CONFIG = isDevnet ? new PublicKey("GjLEiquek1Nc2YjcBhufUGFRkaqW1JhaGjsdFd8mys38") : new PublicKey("Gex2NJRS3jVLPfbzSFM5d5DRsNoL5ynnwT1TXoDEhanz");
const LOCKING_PROGRAM_ID = isDevnet ? new PublicKey("DLockwT7X7sxtLmGH9g5kmfcjaBtncdbUmi738m5bvQC") : new PublicKey("LockrWmn6K5twhz3y9w1dQERbmgSaRkfnTeTKbpofwE");
const CRANKER_PROGRAM_ID = new PublicKey("crnkhL22KkRwLWFH5V3Zq33MZ2kH6iJ4Uhy9HDShbU1");
const CLMM_PROGRAM_ID = isDevnet ? DEVNET_PROGRAM_ID.CLMM : MAINNET_CLMM_PROGRAM_ID;

// Seeds for derive PDAs
const withdrawAuthoritySeed = "withdraw_authority";
const withdrawVaultSeed = "withdraw_vault";
const mintAuthoritySeed = "mint_authority";
const tokenAuthoritySeed = "token_authority";
const clmmLockAuthoritySeed = "program_authority_seed";
const lockedPositionSeed = "locked_position";

export async function buildMintTokenInstruction(
    minter: PublicKey,
    mintAccount: PublicKey,
    metadata: MetadataParams,
    tokenFeeParams: TokenFeeParams,
    distributionMint: PublicKey,
    distributionTokenProgram: PublicKey
) {
    // Derive PDAs
    const platformMintAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from(mintAuthoritySeed)],
        mgfProgram.programId
    )[0];

    const platformTokenAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from(tokenAuthoritySeed)],
        mgfProgram.programId
    )[0];

    const platformTokenWithdrawAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from(withdrawAuthoritySeed)],
        EXECUTOR_PROGRAM_ID
    )[0];

    const minterTokenAccount = getAssociatedTokenAddressSync(
        mintAccount,
        minter,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenCollectionVault = PublicKey.findProgramAddressSync(
        [Buffer.from(withdrawVaultSeed), mintAccount.toBuffer()],
        EXECUTOR_PROGRAM_ID
    )[0];

    const platformFeeTokenAccount = getAssociatedTokenAddressSync(
        distributionMint,
        PLATFORM_FEE_ACCOUNT,
        true,
        distributionTokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const distributionTokenAccount = getAssociatedTokenAddressSync(
        distributionMint,
        tokenCollectionVault,
        true,
        distributionTokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenCollectionAccount = getAssociatedTokenAddressSync(
        mintAccount,
        tokenCollectionVault,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const minterDistributionTokenAccount = getAssociatedTokenAddressSync(
        distributionMint,
        minter,
        true,
        distributionTokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const instruction = await mgfProgram.methods
        .mintToken(metadata, tokenFeeParams)
        .accounts({
            minter: minter,
            mintAccount: mintAccount,
            platformMintAuthority: platformMintAuthority,
            platformTokenAuthority: platformTokenAuthority,
            minterTokenAccount: minterTokenAccount,
            minterDistributionTokenAccount: minterDistributionTokenAccount,
            platformTokenFeeWithdrawAuthority: platformTokenWithdrawAuthority,
            distributionMint,
            tokenCollectionVault,
            tokenCollectionAccount,
            distributionTokenAccount,
            platformFeeAccount: PLATFORM_FEE_ACCOUNT,
            platformFeeTokenAccount,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            distributionTokenProgram: distributionTokenProgram,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            executorProgram: EXECUTOR_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction()

    // Build mint token transaction
    return {
        distributionWallet: distributionTokenAccount,
        instruction: instruction
    }
}


export async function buildCreatePoolInstruction(
    minter: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    sqrtPriceX64: BN,
    openTime: BN
) {
    const poolState = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            POOL_CONFIG.toBuffer(),
            token0.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tokenVault0 = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            token0.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tokenVault1 = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const observationState = PublicKey.findProgramAddressSync(
        [Buffer.from("observation"),
        poolState.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tickArrayBitmap = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_tick_array_bitmap_extension"),
            poolState.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const instruction = await mgfProgram.methods.createPool(sqrtPriceX64, openTime).accounts({
        minter: minter,
        ammConfig: POOL_CONFIG,
        poolState,
        tokenMint0: token0,
        tokenMint1: token1,
        tokenVault0,
        tokenVault1,
        observationState,
        tickArrayBitmap,
        token0Program: TOKEN_2022_PROGRAM_ID,
        token1Program: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        clmmProgram: CLMM_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
    }).instruction();

    return {
        instruction,
        keys: {
            mint: token0.toString(),
            pool_id: poolState.toString(),
            quote_token: token1.toString(),
            token_0_mint: token0.toString(),
            token_1_mint: token1.toString(),
            token_0_vault: tokenVault0.toString(),
            token_1_vault: tokenVault1.toString(),
            observation_state: observationState.toString(),
            tick_array_bitmap: tickArrayBitmap.toString(),
        }
    }
}

export async function buildDepositPoolInstruction(
    minter: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    positionNftMint: PublicKey,
    positionParams: DepositPositionParams,
) {
    const { minTick, maxTick, baseMax, quoteMax } = positionParams;
    const poolState = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"),
        POOL_CONFIG.toBuffer(),
        token0.toBuffer(),
        token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndexByTick(minTick, 120);
    const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndexByTick(maxTick, 120);

    const positionNftAccount = getAssociatedTokenAddressSync(
        positionNftMint,
        minter,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [protocolPosition] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("position"),
            poolState.toBuffer(),
            i32ToBeBytes(minTick),
            i32ToBeBytes(maxTick)
        ],
        CLMM_PROGRAM_ID
    );

    const [tickArrayLower] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("tick_array"),
            poolState.toBuffer(),
            i32ToBeBytes(tickArrayLowerStartIndex)
        ],
        CLMM_PROGRAM_ID
    );

    const [tickArrayUpper] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("tick_array"),
            poolState.toBuffer(),
            i32ToBeBytes(tickArrayUpperStartIndex)
        ],
        CLMM_PROGRAM_ID
    );

    const [personalPosition] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("position"),
            positionNftMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const tokenAccount0 = await getAssociatedTokenAddress(
        token0,
        minter,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenAccount1 = await getAssociatedTokenAddress(
        token1,
        minter,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenVault0 = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            token0.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tokenVault1 = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tickArrayBitmap = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_tick_array_bitmap_extension"),
            poolState.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    return mgfProgram.methods
        .depositPool(
            minTick,
            maxTick,
            tickArrayLowerStartIndex,
            tickArrayUpperStartIndex,
            new BN(0),
            baseMax,
            quoteMax,
        )
        .accounts({
            clmmProgram: CLMM_PROGRAM_ID,
            minter: minter,
            positionNftMint: positionNftMint,
            positionNftAccount,
            poolState,
            protocolPosition,
            tickArrayLower,
            tickArrayUpper,
            personalPosition,
            tokenAccount0,
            tokenAccount1,
            tokenVault0,
            tokenVault1,
            vault0Mint: token0,
            vault1Mint: token1,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
            {
                pubkey: tickArrayBitmap,
                isWritable: true,
                isSigner: false
            }
        ])
        .instruction();
}

export function buildLockLiquidityInstruction(
    minter: PublicKey,
    feeNftMint: PublicKey,
    positionNftMint: PublicKey
) {
    const positionNftAccount = getAssociatedTokenAddressSync(
        positionNftMint,
        minter,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const lockingAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from(clmmLockAuthoritySeed)],
        LOCKING_PROGRAM_ID
    )[0];

    const [personalPosition] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("position"),
            positionNftMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const locked_nft_account = getAssociatedTokenAddressSync(
        positionNftMint,
        lockingAuthority,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const lockedPosition = PublicKey.findProgramAddressSync(
        [Buffer.from(lockedPositionSeed), feeNftMint.toBuffer()],
        LOCKING_PROGRAM_ID
    )[0];

    const feeNftAccount = getAssociatedTokenAddressSync(
        feeNftMint,
        PLATFORM_FEE_ACCOUNT,
        true,
        TOKEN_PROGRAM_ID,
    );

    const [metadataAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), feeNftMint.toBuffer()],
        METADATA_PROGRAM_ID,
    );

    return mgfProgram.methods
        .lockPool()
        .accounts({
            authority: lockingAuthority,
            payer: minter,
            feeNftOwner: PLATFORM_FEE_ACCOUNT,
            positionNftAccount,
            personalPosition,
            positionNftMint,
            lockedNftAccount: locked_nft_account,
            lockedPosition,
            feeNftMint: feeNftMint,
            feeNftAccount: feeNftAccount,
            metadataAccount: metadataAccount,
            metadataProgram: METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            feeNftTokenProgram: TOKEN_PROGRAM_ID,
            lockedNftTokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            lockingProgram: LOCKING_PROGRAM_ID,
        }).instruction();
}

export function buildWrapSolInstruction(
    minter: PublicKey,
    amount: BN
) {
    const tokenAccount = getAssociatedTokenAddressSync(
        WSOLMint,
        minter,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return mgfProgram.methods.wrap(amount).accounts({
        payer: minter,
        tokenAccount: tokenAccount,
        solMint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    }).instruction()
}

export function buildUnwrapSolInstruction(
    minter: PublicKey,
) {
    const tokenAccount = getAssociatedTokenAddressSync(
        WSOLMint,
        minter,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return createCloseAccountInstruction(
        tokenAccount,
        minter,
        minter,
        [],
        TOKEN_PROGRAM_ID
    );
}

export async function buildBuyInstruction(
    payer: PublicKey,
    poolId: PublicKey,
    inputMint: PublicKey,
    outputMint: PublicKey,
    slippage: number,
    amount: BN
) {
    const raydium = await RaydiumService.getInstance();
    let poolInfo: ApiV3PoolInfoConcentratedItem;
    let clmmPoolInfo: ComputeClmmPoolInfo;
    let tickCache: ReturnTypeFetchMultiplePoolTickArrays;

    const data = await raydium.clmm.getPoolInfoFromRpc(poolId.toBase58());
    poolInfo = data.poolInfo;
    clmmPoolInfo = data.computePoolInfo;
    tickCache = data.tickData;

    if (inputMint.toBase58() !== poolInfo.mintB.address)
        throw new Error('input mint does not match pool')

    const { minAmountOut, remainingAccounts, executionPriceX64, realAmountIn } = PoolUtils.computeAmountOutFormat({
        poolInfo: clmmPoolInfo,
        tickArrayCache: tickCache[poolId.toBase58()],
        amountIn: amount,
        tokenOut: poolInfo['mintA'],
        slippage: slippage,
        epochInfo: await raydium.fetchEpochInfo(),
        catchLiquidityInsufficient: true
    });

    const inputTokenAccount = await getAssociatedTokenAddress(
        inputMint,
        payer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const outputTokenAccount = await getAssociatedTokenAddress(
        outputMint,
        payer,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [inputVault] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            clmmPoolInfo.id.toBuffer(),
            inputMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const [outputVault] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            clmmPoolInfo.id.toBuffer(),
            outputMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const accountMetas = remainingAccounts.map((pubkey: any) => ({
        pubkey,
        isSigner: false,
        isWritable: true
    }));

    return mgfProgram.methods
        .buy(
            minAmountOut.amount.raw.abs(),
            realAmountIn.amount.raw,
            executionPriceX64
        )
        .accounts({
            payer: payer,
            ammConfig: POOL_CONFIG,
            poolState: clmmPoolInfo.id,
            inputTokenAccount: inputTokenAccount,
            outputTokenAccount: outputTokenAccount,
            inputVault: inputVault,
            platformCranker: CRANKER_PROGRAM_ID,
            outputVault: outputVault,
            observationState: clmmPoolInfo.observationId,
            inputVaultMint: inputMint,
            outputVaultMint: outputMint,
            clmmProgram: CLMM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            memoProgram: MEMO_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        }).remainingAccounts(accountMetas)
        .instruction();
}

export async function buildSellInstruction(
    payer: PublicKey,
    poolId: PublicKey,
    inputMint: PublicKey,
    outputMint: PublicKey,
    slippage: number,
    amount: BN
) {
    const raydium = await RaydiumService.getInstance();
    let poolInfo: ApiV3PoolInfoConcentratedItem;
    let clmmPoolInfo: ComputeClmmPoolInfo;
    let tickCache: ReturnTypeFetchMultiplePoolTickArrays;

    const data = await raydium.clmm.getPoolInfoFromRpc(poolId.toBase58());
    poolInfo = data.poolInfo;
    clmmPoolInfo = data.computePoolInfo;
    tickCache = data.tickData;

    if (inputMint.toBase58() !== poolInfo.mintA.address)
        throw new Error('input mint does not match pool')

    const { minAmountOut, remainingAccounts, realAmountIn } = PoolUtils.computeAmountOutFormat({
        poolInfo: clmmPoolInfo,
        tickArrayCache: tickCache[poolId.toBase58()],
        amountIn: amount,
        tokenOut: poolInfo['mintB'],
        slippage: slippage,
        epochInfo: await raydium.fetchEpochInfo(),
        catchLiquidityInsufficient: true
    });

    const inputTokenAccount = await getAssociatedTokenAddress(
        inputMint,
        payer,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const outputTokenAccount = await getAssociatedTokenAddress(
        outputMint,
        payer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [inputVault] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            clmmPoolInfo.id.toBuffer(),
            inputMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const [outputVault] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            clmmPoolInfo.id.toBuffer(),
            outputMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const accountMetas = remainingAccounts.map((pubkey: any) => ({
        pubkey,
        isSigner: false,
        isWritable: true
    }));

    return mgfProgram.methods
        .sell(
            realAmountIn.amount.raw,
            minAmountOut.amount.raw.abs(),
            new BN(0)
        )
        .accounts({
            payer: payer,
            ammConfig: POOL_CONFIG,
            poolState: clmmPoolInfo.id,
            inputTokenAccount: inputTokenAccount,
            outputTokenAccount: outputTokenAccount,
            inputVault: inputVault,
            platformCranker: CRANKER_PROGRAM_ID,
            outputVault: outputVault,
            observationState: clmmPoolInfo.observationId,
            inputVaultMint: inputMint,
            outputVaultMint: outputMint,
            clmmProgram: CLMM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            memoProgram: MEMO_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        }).remainingAccounts(accountMetas)
        .instruction();
}

function i32ToBeBytes(num: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32BE(num, 0);
    return buffer;
}