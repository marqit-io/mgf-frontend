import { Program, AnchorProvider, Idl, BN } from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Connection,
    TransactionInstruction
} from '@solana/web3.js';
import {
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createCloseAccountInstruction
} from '@solana/spl-token';
import { MgfMatrix as IDL } from './mgf_matrix';
import { DevnetPoolConfig } from './pool_config';
import { token } from '@coral-xyz/anchor/dist/cjs/utils';

const PLATFORM_FEE_ACCOUNT = new PublicKey("mqtj8nemKcW1y3fQhBz6ENWNsiHGqZ5M3ySmefokEnJ");
const CLMM_PROGRAM_ID = new PublicKey("devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH");
const POOL_CONFIG = new PublicKey("CQYbhr6amxUER4p5SC44C63R4qw4NFc9Z4Db9vF4tZwG");
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const LOCKING_PROGRAM_ID = new PublicKey("DLockwT7X7sxtLmGH9g5kmfcjaBtncdbUmi738m5bvQC");
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const PLATFORM_CRANKER = new PublicKey("mqtj8nemKcW1y3fQhBz6ENWNsiHGqZ5M3ySmefokEnJ");

export async function buildMintTokenInstruction(
    connection: Connection,
    minter: PublicKey,
    mintAccount: PublicKey,
    metadata: { name: string, symbol: string, uri: string },
    tokenFeeParams: {
        isDistributeToken: boolean,
        transferFeeBps: number,
        distributeFeeBps: number,
        burnFeeBps: number,
        tokenRewardMint: PublicKey | null,
        distributionInterval: number | null
    },
    distributionToken: PublicKey,
    distributionTokenProgram: PublicKey,
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: minter } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    const withdrawAuthoritySeed = "withdraw_authority";
    const withdrawVaultSeed = "withdraw_vault";
    const mintAuthoritySeed = "mint_authority";
    const tokenAuthoritySeed = "token_authority";
    const executorStateSeed = "executor_state";

    if (!import.meta.env.VITE_MGF_EXECUTOR_PROGRAM_ID) {
        throw new Error("VITE_MGF_EXECUTOR_PROGRAM_ID is not set");
    }

    const executorProgramId = new PublicKey(import.meta.env.VITE_MGF_EXECUTOR_PROGRAM_ID);

    // Derive PDAs
    const platformMintAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from(mintAuthoritySeed)],
        program.programId
    )[0];

    const platformTokenAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from(tokenAuthoritySeed)],
        program.programId
    )[0];

    const platformTokenWithdrawAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from(withdrawAuthoritySeed)],
        executorProgramId
    )[0];

    const platformFeeTokenAccount = getAssociatedTokenAddressSync(
        distributionToken,
        PLATFORM_FEE_ACCOUNT,
        true,
        distributionTokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    // Get minter's token account
    const minterTokenAccount = getAssociatedTokenAddressSync(
        mintAccount,
        minter,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const minterDistributionTokenAccount = getAssociatedTokenAddressSync(
        distributionToken,
        minter,
        false,
        distributionTokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID);

    const tokenCollectionVault = PublicKey.findProgramAddressSync(
        [Buffer.from(withdrawVaultSeed), mintAccount.toBuffer()],
        executorProgramId
    )[0];


    const distributionMint = distributionToken;

    const distributionTokenAccount = getAssociatedTokenAddressSync(distributionMint, tokenCollectionVault, true, distributionTokenProgram, ASSOCIATED_TOKEN_PROGRAM_ID);
    const tokenCollectionAccount = getAssociatedTokenAddressSync(mintAccount, tokenCollectionVault, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    // Create mint token instruction
    return program.methods
        .mintToken(metadata, tokenFeeParams)
        .accounts({
            minter,
            mintAccount,
            platformMintAuthority,
            platformTokenAuthority,
            minterTokenAccount,
            minterDistributionTokenAccount,
            platformTokenFeeWithdrawAuthority: platformTokenWithdrawAuthority,
            distributionMint,
            tokenCollectionVault,
            tokenCollectionAccount,
            distributionTokenAccount,
            platformFeeAccount: PLATFORM_FEE_ACCOUNT,
            platformFeeTokenAccount,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            distributionTokenProgram,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();
}

export async function buildCreatePoolInstruction(
    connection: Connection,
    minter: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    mintAccount: PublicKey,
    poolParams: DevnetPoolConfig,
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: minter } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    // Check if mint token can be token0 (must be smaller than SOL_MINT)
    if (mintAccount.toBase58() >= SOL_MINT.toBase58()) {
        throw new Error("Mint token address must be smaller than SOL address to satisfy pool constraints");
    }

    // Get PDAs
    const poolState = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            POOL_CONFIG.toBuffer(),
            token0.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const extendedMintAccount = PublicKey.findProgramAddressSync(
        [
            Buffer.from("support_mint"),
            token0.toBuffer()
        ],
        TOKEN_2022_PROGRAM_ID
    )[0];

    const observationState = PublicKey.findProgramAddressSync(
        [Buffer.from("observation"),
        poolState.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    // Get token vaults
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

    // Create pool instruction
    return program.methods
        .createPool(poolParams.sqrtPrice, new BN(0))
        .accounts({
            minter: minter,
            ammConfig: POOL_CONFIG,
            poolState,
            tokenMint: mintAccount,
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
        }).remainingAccounts([
            {
                pubkey: extendedMintAccount,
                isWritable: false,
                isSigner: false
            }
        ]).instruction();
}

export async function buildDepositPoolInstruction(
    connection: Connection,
    minter: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    poolParams: DevnetPoolConfig,
    positionNFTMint: PublicKey
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: minter } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    const poolState = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            POOL_CONFIG.toBuffer(),
            token0.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const platformTokenAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from("token_authority")],
        program.programId
    )[0];

    const positionNftAccount = getAssociatedTokenAddressSync(
        positionNFTMint,
        minter,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const protocolPosition = PublicKey.findProgramAddressSync(
        [
            Buffer.from("position"),
            poolState.toBuffer(),
            i32ToBeBytes(poolParams.tickLowerIndex),
            i32ToBeBytes(poolParams.tickUpperIndex)
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tickArrayLower = PublicKey.findProgramAddressSync(
        [
            Buffer.from("tick_array"),
            poolState.toBuffer(),
            i32ToBeBytes(poolParams.tickArrayLowerStartIndex)
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tickArrayUpper = PublicKey.findProgramAddressSync(
        [
            Buffer.from("tick_array"),
            poolState.toBuffer(),
            i32ToBeBytes(poolParams.tickArrayUpperStartIndex)
        ],
        CLMM_PROGRAM_ID
    )[0];

    const personalPosition = PublicKey.findProgramAddressSync(
        [
            Buffer.from("position"),
            positionNFTMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )[0];

    const tokenAccount0 = getAssociatedTokenAddressSync(
        token0,
        minter,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenAccount1 = getAssociatedTokenAddressSync(
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

    // Create deposit pool instruction
    return program.methods
        .depositPool(
            poolParams.tickLowerIndex,
            poolParams.tickUpperIndex,
            poolParams.tickArrayLowerStartIndex,
            poolParams.tickArrayUpperStartIndex,
            poolParams.liquidityAmount,
            poolParams.amount0Max,
            poolParams.amount1Max,
        )
        .accounts({
            clmmProgram: CLMM_PROGRAM_ID,
            minter: minter,
            platformTokenAuthority,
            positionNftMint: positionNFTMint,
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

export async function buildWrapSolInstruction(
    connection: Connection,
    payer: PublicKey,
    amount: BN
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: payer } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    const wSolMint = new PublicKey("So11111111111111111111111111111111111111112");

    const tokenAccount = await getAssociatedTokenAddress(
        wSolMint,
        payer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return program.methods
        .wrapSol(amount)
        .accounts({
            payer: payer,
            tokenAccount: tokenAccount,
            solMint: SOL_MINT,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();
}

export async function buildUnwrapSolInstruction(
    payer: PublicKey
): Promise<TransactionInstruction> {
    const wSolMint = new PublicKey("So11111111111111111111111111111111111111112");
    const tokenAccount = await getAssociatedTokenAddress(
        wSolMint,
        payer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return createCloseAccountInstruction(
        tokenAccount,
        payer,
        payer,
        [],
        TOKEN_PROGRAM_ID
    );
}

export async function buildLockPoolInstruction(
    connection: Connection,
    minter: PublicKey,
    poolPositionNFTMint: PublicKey,
    feeNFTMint: PublicKey
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: minter } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    const CLMM_LOCK_AUTH_SEED = "program_authority_seed";
    const LOCKED_POSITION_SEED = "locked_position";

    const locking_authority = PublicKey.findProgramAddressSync(
        [Buffer.from(CLMM_LOCK_AUTH_SEED)],
        LOCKING_PROGRAM_ID
    )[0];

    const positionNftAccount = getAssociatedTokenAddressSync(
        poolPositionNFTMint,
        minter,
        true,
        TOKEN_2022_PROGRAM_ID,
    );

    const personalPosition = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), poolPositionNFTMint.toBuffer()],
        CLMM_PROGRAM_ID
    )[0];

    const lockedNFTAccount = getAssociatedTokenAddressSync(
        poolPositionNFTMint,
        locking_authority,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const lockedPosition = PublicKey.findProgramAddressSync(
        [Buffer.from(LOCKED_POSITION_SEED), feeNFTMint.toBuffer()],
        LOCKING_PROGRAM_ID
    )[0];

    const feeNFTAccount = getAssociatedTokenAddressSync(
        feeNFTMint,
        PLATFORM_FEE_ACCOUNT,
        true,
        TOKEN_PROGRAM_ID,
    );

    const metadataAccount = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), feeNFTMint.toBuffer()],
        METADATA_PROGRAM_ID
    )[0];

    return program.methods
        .lockPool()
        .accounts({
            authority: locking_authority,
            payer: minter,
            feeNftOwner: PLATFORM_FEE_ACCOUNT,
            positionNftAccount,
            personalPosition,
            positionNftMint: poolPositionNFTMint,
            lockedNftAccount: lockedNFTAccount,
            lockedPosition,
            feeNftMint: feeNFTMint,
            feeNftAccount: feeNFTAccount,
            metadataAccount: metadataAccount,
            metadataProgram: METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            feeNftTokenProgram: TOKEN_PROGRAM_ID,
            lockedNftTokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            lockingProgram: LOCKING_PROGRAM_ID,
        })
        .instruction();
}

export async function buildBuyInstruction(
    connection: Connection,
    payer: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    amount: BN,
    otherAmountThreshold: BN,
    sqrtPriceLimitX64: BN,
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: payer } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    const inputVaultMint = token0;
    const outputVaultMint = token1;

    const [poolState] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            POOL_CONFIG.toBuffer(),
            token0.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    // Get observation state PDA
    const [observationState] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("observation"),
            poolState.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );


    const inputTokenAccount = await getAssociatedTokenAddress(
        inputVaultMint,
        payer,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const outputTokenAccount = await getAssociatedTokenAddress(
        outputVaultMint,
        payer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [inputVault] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            inputVaultMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const [outputVault] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            outputVaultMint.toBuffer()
        ],
        CLMM_PROGRAM_ID
    )

    return program.methods
        .buy(
            amount,
            otherAmountThreshold,
            sqrtPriceLimitX64
        )
        .accounts({
            clmmProgram: CLMM_PROGRAM_ID,
            payer: payer,
            platformCranker: PLATFORM_CRANKER,
            ammConfig: POOL_CONFIG,
            poolState: poolState,
            inputTokenAccount: inputTokenAccount,
            outputTokenAccount: outputTokenAccount,
            inputVault: inputVault,
            outputVault: outputVault,
            observationState: observationState,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            memoProgram: MEMO_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            inputVaultMint: inputVaultMint,
            outputVaultMint: outputVaultMint,
        })
        .instruction();
}

// Helper function to convert i32 to bytes in big-endian format (for tick indices)
function i32ToBeBytes(num: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32BE(num, 0);
    return buffer;
}