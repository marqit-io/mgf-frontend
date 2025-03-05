import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Keypair,
    Connection,
    TransactionInstruction
} from '@solana/web3.js';
import {
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync
} from '@solana/spl-token';
import BN from 'bn.js';
import { MgfMatrix as IDL } from './mgf_matrix';

interface TokenMetadataArgs {
    uri: string;
    name: string;
    symbol: string;
}

interface TokenParams {
    transferFeeBps: number;      // i16 in IDL
    distributeFeeBps: number;    // i16 in IDL
    burnFeeBps: number;         // i16 in IDL
    tokenRewardMint: PublicKey | null;  // option<pubkey> in IDL
    distributionInterval: number | null; // option<i32> in IDL
}

interface PoolParams {
    initialPrice: BN;
    openTime: BN;
    tickLowerIndex: number;
    tickUpperIndex: number;
    tickArrayLowerStartIndex: number;
    tickArrayUpperStartIndex: number;
    liquidityAmount: BN;
    amount0Max: BN;
    amount1Max: BN;
}

export async function createMintTokenInstruction(
    connection: Connection,
    payer: PublicKey,
    mintKeypair: Keypair,
    tokenMetadataArgs: TokenMetadataArgs
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: payer } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    // Get PDAs
    const [platformMintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_authority")],
        program.programId
    );

    const [platformTokenAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_authority")],
        program.programId
    );

    const [platformTokenTransferFeeAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_transfer_fee_authority")],
        program.programId
    );

    // Get platform token account
    const platformTokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        platformTokenAuthority,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Create mint token instruction
    return program.methods
        .mintToken(tokenMetadataArgs)
        .accounts({
            minter: payer,
            platformMintAuthority,
            platformTokenAuthority,
            platformTokenTransferFeeAuthority,
            mintAccount: mintKeypair.publicKey,
            platformTokenAccount,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();
}

export async function createPoolInstruction(
    connection: Connection,
    payer: PublicKey,
    mintPubkey: PublicKey,
    poolParams: PoolParams
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: payer } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    // Constants
    const CLMM_PROGRAM_ID = new PublicKey("devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH");
    const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
    const POOL_CONFIG = new PublicKey("CQYbhr6amxUER4p5SC44C63R4qw4NFc9Z4Db9vF4tZwG");
    const platformPoolAuthority = new PublicKey("BhL1wh6cfQcr22cf6bvAvM5Jv3KCfVohgTPGLtf9eXAE");

    // Determine token ordering based on lexicographical comparison
    const token0 = SOL_MINT;
    const token1 = mintPubkey;

    // Get PDAs
    const [poolState] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            POOL_CONFIG.toBuffer(),
            token0.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    // Get token vaults
    const [tokenVault0] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            token0.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const [tokenVault1] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_vault"),
            poolState.toBuffer(),
            token1.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_tick_array_bitmap_extension"),
            poolState.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const observationStateKeypair = Keypair.generate();

    // Create pool instruction
    return program.methods
        .createPool(poolParams.initialPrice, poolParams.openTime)
        .accounts({
            minter: payer,
            platformPoolAuthority,
            ammConfig: POOL_CONFIG,
            poolState,
            tokenMint: mintPubkey,
            tokenMint0: token0,
            tokenMint1: token1,
            tokenVault0,
            tokenVault1,
            observationState: observationStateKeypair.publicKey,
            tickArrayBitmap,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            clmmProgram: CLMM_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();
}

export async function createDepositPoolInstruction(
    connection: Connection,
    payer: PublicKey,
    mintKeypair: PublicKey,
    poolParams: PoolParams
): Promise<TransactionInstruction> {
    const provider = new AnchorProvider(
        connection,
        { publicKey: payer } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);

    // Constants
    const CLMM_PROGRAM_ID = new PublicKey("devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH");
    const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
    const POOL_CONFIG = new PublicKey("Gex2NJRS3jVLPfbzSFM5d5DRsNoL5ynnwT1TXoDEhanz");
    const TOKEN_PROGRAM = TOKEN_PROGRAM_ID;
    const TOKEN_PROGRAM_2022 = TOKEN_2022_PROGRAM_ID;
    const METADATA_PROGRAM = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    // Get PDAs
    const platformPoolAuthority = new PublicKey("BhL1wh6cfQcr22cf6bvAvM5Jv3KCfVohgTPGLtf9eXAE");

    const [poolState] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            POOL_CONFIG.toBuffer(),
            mintKeypair.toBuffer(),
            SOL_MINT.toBuffer()
        ],
        CLMM_PROGRAM_ID
    );

    const [positionNftMint] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_nft_mint"),
            mintKeypair.toBuffer(),
            platformPoolAuthority.toBuffer()
        ],
        program.programId
    );

    const [positionNftAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_nft_account"),
            mintKeypair.toBuffer()
        ],
        program.programId
    );

    const [metadataAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool_nft_metadata"),
            mintKeypair.toBuffer(),
            platformPoolAuthority.toBuffer()
        ],
        program.programId
    );

    const [protocolPosition] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("position"),
            poolState.toBuffer(),
            Buffer.from(poolParams.tickLowerIndex.toString()),
            Buffer.from(poolParams.tickUpperIndex.toString())
        ],
        CLMM_PROGRAM_ID
    );

    const [tickArrayLower] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("tick_array"),
            poolState.toBuffer(),
            Buffer.from(poolParams.tickArrayLowerStartIndex.toString())
        ],
        CLMM_PROGRAM_ID
    );

    const [tickArrayUpper] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("tick_array"),
            poolState.toBuffer(),
            Buffer.from(poolParams.tickArrayUpperStartIndex.toString())
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

    // Get token accounts
    const tokenAccount0 = await getAssociatedTokenAddress(
        SOL_MINT,
        payer,
        true,
        TOKEN_PROGRAM
    );

    const tokenAccount1 = await getAssociatedTokenAddress(
        mintKeypair,
        payer,
        true,
        TOKEN_PROGRAM_2022
    );

    const tokenVault0 = await getAssociatedTokenAddress(
        SOL_MINT,
        platformPoolAuthority,
        true,
        TOKEN_PROGRAM
    );

    const tokenVault1 = await getAssociatedTokenAddress(
        mintKeypair,
        platformPoolAuthority,
        true,
        TOKEN_PROGRAM_2022
    );

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
            true, // withMetadata
            null  // baseFlag
        )
        .accounts({
            clmmProgram: CLMM_PROGRAM_ID,
            minter: payer,
            platformPoolAuthority,
            tokenMint: mintKeypair,
            tokenMint0: SOL_MINT,
            tokenMint1: mintKeypair,
            positionNftMint,
            positionNftAccount,
            metadataAccount,
            poolState,
            protocolPosition,
            tickArrayLower,
            tickArrayUpper,
            personalPosition,
            tokenAccount0,
            tokenAccount1,
            tokenVault0,
            tokenVault1,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            metadataProgram: METADATA_PROGRAM,
            tokenProgram: TOKEN_PROGRAM,
            tokenProgram2022: TOKEN_PROGRAM_2022,
            vault0Mint: SOL_MINT,
            vault1Mint: mintKeypair,
        })
        .instruction();
}

export const UpdateTransferFeeInstruction = (
    connection: Connection,
    payer: PublicKey,
    tokenMint: PublicKey,
    tokenParams: TokenParams
): Promise<TransactionInstruction> => {
    const provider = new AnchorProvider(
        connection,
        { publicKey: payer } as any,
        { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, provider);
    const platformCranker = new PublicKey("FSUe5MMWfHTuzdsEgSWNcbtt2akgSqKovJbwts6FYt2W");

    return program.methods.updateTransferFee(tokenParams)
        .accounts({
            minter: payer,
            tokenMint,
            platformCranker,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();
}