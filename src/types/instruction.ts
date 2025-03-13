import { BN } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"
import Decimal from "decimal.js"

export type MetadataParams = {
    name: string,
    symbol: string,
    uri: string
}

export type TokenFeeParams = {
    isDistributeToken: boolean,
    transferFeeBps: number,
    distributeFeeBps: number,
    burnFeeBps: number,
    tokenRewardMint: PublicKey,
    distributionInterval: number
}

export type DepositPositionParams = {
    baseMax: BN;
    quoteMax: BN;
    minTick: number;
    maxTick: number;
}

export type PoolAccounts = {
    poolState: PublicKey;
    tokenMint0: PublicKey;
    tokenMint1: PublicKey;
    tokenVault0: PublicKey;
    tokenVault1: PublicKey;
    tickArrayBitmap: PublicKey;
    observationState: PublicKey;
    extendedMintAccount: PublicKey;
}

export type MarketParams = {
    quoteTokenMint: PublicKey,
    quoteTokenDecimals: number,
    baseTokenDecimals: number,
    baseSupply: BN,
    tickSpacing: number,
    startPrice: Decimal,
    endPrice: Decimal
}

export type CreatePositionParams = {
    poolInitPrice: number;
    baseMax: BN;
    quoteMax: BN;
    liquidityAmount: BN;
    initialTick: number;
    minTick: number;
    maxTick: number;
    initialSqrtPriceX64: BN;
    baseMint: PublicKey;
    quoteMint: PublicKey;
    quoteDecimals: number;
}
