import { BN } from "@coral-xyz/anchor";

// Type definitions for pool configuration
export interface DevnetPoolConfig {
    sqrtPrice: BN;                      // Q64.64 format (u128 in Rust)
    tickArrayLowerStartIndex: number;   // i32 in Rust
    tickArrayUpperStartIndex: number;   // i32 in Rust
    tickLowerIndex: number;             // i32 in Rust
    tickUpperIndex: number;             // i32 in Rust
    amount0Max: BN;                     // u64 in Rust
    amount1Max: BN;                     // u64 in Rust
    liquidityAmount: BN;                // u128 in Rust
    isBase: boolean;                    // bool in Rust
}

// Constants from Rust backend
export const USDC_SQRT_PRICE = new BN("41248173712355948"); // Q64.64 format (u128 in Rust)
export const SOL_SQRT_PRICE = new BN("58333726687135158"); // Q64.64 format (u128 in Rust)

export const USDC_TICK_ARRAY_LOWER_START_INDEX = -122400; // i32 in Rust
export const USDC_TICK_ARRAY_UPPER_START_INDEX = 0;      // i32 in Rust
export const USDC_TICK_LOWER_INDEX = -122400;            // i32 in Rust
export const USDC_TICK_UPPER_INDEX = 0;                  // i32 in Rust

export const SOL_TICK_ARRAY_LOWER_START_INDEX = -115200; // i32 in Rust
export const SOL_TICK_ARRAY_UPPER_START_INDEX = 6600;       // i32 in Rust //PROBABLY 0 on mainnet or 6600 will see
export const SOL_TICK_LOWER_INDEX = -115130;             // i32 in Rust
export const SOL_TICK_UPPER_INDEX = 6960;                // i32 in Rust

export const MEME_SUPPLY = new BN("1000000000000000000"); // Convert to BN for consistency
export const USDC_MAX_AMOUNT = new BN(23871635); // u64 in Rust
export const SOL_MAX_AMOUNT = new BN(350000);   // u64 in Rust

// Token mint addresses
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOL_MINT = "So11111111111111111111111111111111111111112";

// Helper functions to create pool configurations
export function createUSDCConfig(): DevnetPoolConfig {
    return {
        sqrtPrice: USDC_SQRT_PRICE,
        tickArrayLowerStartIndex: USDC_TICK_ARRAY_LOWER_START_INDEX,
        tickArrayUpperStartIndex: USDC_TICK_ARRAY_UPPER_START_INDEX,
        tickLowerIndex: USDC_TICK_LOWER_INDEX,
        tickUpperIndex: USDC_TICK_UPPER_INDEX,
        amount0Max: MEME_SUPPLY, // Use BN directly
        amount1Max: USDC_MAX_AMOUNT,
        liquidityAmount: new BN(0), // u128 in Rust
        isBase: true
    };
}

export function createSOLConfig(buyAmount: number, depositSol: number, feePercentage: number): DevnetPoolConfig {

    return {
        sqrtPrice: SOL_SQRT_PRICE,
        tickArrayLowerStartIndex: SOL_TICK_ARRAY_LOWER_START_INDEX,
        tickArrayUpperStartIndex: SOL_TICK_ARRAY_UPPER_START_INDEX,
        tickLowerIndex: SOL_TICK_LOWER_INDEX,
        tickUpperIndex: SOL_TICK_UPPER_INDEX,
        amount0Max: MEME_SUPPLY.sub(new BN(feePercentage + "00000000000000")), // testing fee
        amount1Max: SOL_MAX_AMOUNT, // Use BN directly
        liquidityAmount: new BN(0), // u128 in Rust
        isBase: true
    };
}