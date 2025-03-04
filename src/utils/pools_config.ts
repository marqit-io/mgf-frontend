// Type definitions for pool configuration
export interface PoolConfig {
    sqrt_price: bigint;                    // Q64.64 format (u128 in Rust)
    tick_array_lower_start_index: number;  // i32 in Rust
    tick_array_upper_start_index: number;  // i32 in Rust
    tick_lower_index: number;              // i32 in Rust
    tick_upper_index: number;              // i32 in Rust
    amount_0_max: number;                  // u64 in Rust
    amount_1_max: number;                  // u64 in Rust
    is_base: boolean;                      // bool in Rust
}

// Constants from Rust backend
export const USDC_SQRT_PRICE = BigInt("41248173712355948"); // Q64.64 format (u128 in Rust)
export const SOL_SQRT_PRICE = BigInt("58333726687135158"); // Q64.64 format (u128 in Rust)

export const USDC_TICK_ARRAY_LOWER_START_INDEX = -122400; // i32 in Rust
export const USDC_TICK_ARRAY_UPPER_START_INDEX = 0;      // i32 in Rust
export const USDC_TICK_LOWER_INDEX = -122400;            // i32 in Rust
export const USDC_TICK_UPPER_INDEX = 0;                  // i32 in Rust

export const SOL_TICK_ARRAY_LOWER_START_INDEX = -115200; // i32 in Rust
export const SOL_TICK_ARRAY_UPPER_START_INDEX = 0;       // i32 in Rust
export const SOL_TICK_LOWER_INDEX = -115200;             // i32 in Rust
export const SOL_TICK_UPPER_INDEX = 6960;                // i32 in Rust

export const MEME_SUPPLY = BigInt("1000000000000000000n"); // Example value - replace with constant
export const USDC_MAX_AMOUNT = 23871635; // u64 in Rust
export const SOL_MAX_AMOUNT = 33325552;   // u64 in Rust

// Token mint addresses
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOL_MINT = "So11111111111111111111111111111111111111112";

// Helper functions to create pool configurations
export function createUSDCConfig(): PoolConfig {
    return {
        sqrt_price: USDC_SQRT_PRICE,
        tick_array_lower_start_index: USDC_TICK_ARRAY_LOWER_START_INDEX,
        tick_array_upper_start_index: USDC_TICK_ARRAY_UPPER_START_INDEX,
        tick_lower_index: USDC_TICK_LOWER_INDEX,
        tick_upper_index: USDC_TICK_UPPER_INDEX,
        amount_0_max: Number(MEME_SUPPLY),
        amount_1_max: USDC_MAX_AMOUNT,
        is_base: true
    };
}

export function createSOLConfig(): PoolConfig {
    return {
        sqrt_price: SOL_SQRT_PRICE,
        tick_array_lower_start_index: SOL_TICK_ARRAY_LOWER_START_INDEX,
        tick_array_upper_start_index: SOL_TICK_ARRAY_UPPER_START_INDEX,
        tick_lower_index: SOL_TICK_LOWER_INDEX,
        tick_upper_index: SOL_TICK_UPPER_INDEX,
        amount_0_max: SOL_MAX_AMOUNT,
        amount_1_max: Number(MEME_SUPPLY),
        is_base: true
    };
}