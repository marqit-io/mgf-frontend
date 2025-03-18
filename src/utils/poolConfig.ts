import { LiquidityMath, SqrtPriceMath, TickMath } from "@raydium-io/raydium-sdk-v2";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { CreatePositionParams, MarketParams } from "../types/instruction";

const MEME_SUPPLY = new BN("1000000000000000");
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

export const SOL_PARAMS: MarketParams = {
    quoteTokenMint: WSOL_MINT,
    quoteTokenDecimals: 9,
    baseTokenDecimals: 6,
    baseSupply: MEME_SUPPLY,
    tickSpacing: 120,
    startPrice: new Decimal(0.00000005),
    endPrice: new Decimal(0.2),
}

export const USDC_PARAMS: MarketParams = {
    quoteTokenMint: USDC_MINT,
    quoteTokenDecimals: 6,
    baseTokenDecimals: 6,
    baseSupply: MEME_SUPPLY,
    tickSpacing: 120,
    startPrice: new Decimal(0.00005),
    endPrice: new Decimal(2),
}

export function calculateLaunchParameters(
    market: MarketParams,
    baseMint: PublicKey,
    minterQuoteTokenAmount?: BN,
): CreatePositionParams {

    const { quoteTokenDecimals, baseTokenDecimals, tickSpacing, startPrice, endPrice, baseSupply } = market;
    const poolBaseTokenAmount = baseSupply;
    const initialTick = TickMath.getTickWithPriceAndTickspacing(startPrice, tickSpacing, baseTokenDecimals, quoteTokenDecimals);
    const initialSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(initialTick);
    const actualPrice = SqrtPriceMath.sqrtPriceX64ToPrice(initialSqrtPriceX64, baseTokenDecimals, quoteTokenDecimals);
    const minTick = TickMath.getTickWithPriceAndTickspacing(startPrice, tickSpacing, baseTokenDecimals, quoteTokenDecimals);
    const maxTick = TickMath.getTickWithPriceAndTickspacing(endPrice, tickSpacing, baseTokenDecimals, quoteTokenDecimals);
    const minSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(minTick);
    const maxSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(maxTick);
    const initialLiquidityAmount = LiquidityMath.getLiquidityFromTokenAmounts(
        initialSqrtPriceX64,
        minSqrtPriceX64,
        maxSqrtPriceX64,
        poolBaseTokenAmount,
        new BN(0)
    );
    // Handle case with quote token contribution
    if (minterQuoteTokenAmount) {
        const adjustedSqrtPriceX64 = SqrtPriceMath.getNextSqrtPriceX64FromInput(
            initialSqrtPriceX64,
            initialLiquidityAmount,
            minterQuoteTokenAmount,
            false
        );
        const adjustedPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
            adjustedSqrtPriceX64,
            baseTokenDecimals,
            quoteTokenDecimals
        );
        const adjustedTick = TickMath.getTickWithPriceAndTickspacing(
            adjustedPrice,
            tickSpacing,
            baseTokenDecimals,
            quoteTokenDecimals
        );
        const adjustedSqrtPriceFromTick = SqrtPriceMath.getSqrtPriceX64FromTick(adjustedTick);
        const baseTokensExchanged = LiquidityMath.getTokenAmountAFromLiquidity(
            initialSqrtPriceX64,
            adjustedSqrtPriceX64,
            initialLiquidityAmount,
            false
        );
        const adjustedBaseTokenAmount = poolBaseTokenAmount.sub(baseTokensExchanged);
        const adjustedLiquidityAmount = LiquidityMath.getLiquidityFromTokenAmounts(
            adjustedSqrtPriceFromTick,
            minSqrtPriceX64,
            maxSqrtPriceX64,
            adjustedBaseTokenAmount,
            minterQuoteTokenAmount
        );
        const result = {
            poolInitPrice: adjustedPrice.toNumber(),
            baseMax: adjustedBaseTokenAmount,
            quoteMax: minterQuoteTokenAmount,
            liquidityAmount: adjustedLiquidityAmount,
            initialTick: adjustedTick,
            minTick,
            maxTick,
            initialSqrtPriceX64: adjustedSqrtPriceFromTick,
            baseMint,
            quoteMint: market.quoteTokenMint,
            quoteDecimals: market.quoteTokenDecimals
        };
        return result;
    }

    const result = {
        poolInitPrice: actualPrice.toNumber(),
        baseMax: poolBaseTokenAmount,
        quoteMax: new BN(0),
        liquidityAmount: initialLiquidityAmount,
        initialTick: initialTick,
        minTick,
        maxTick,
        initialSqrtPriceX64,
        baseMint,
        quoteMint: market.quoteTokenMint,
        quoteDecimals: market.quoteTokenDecimals
    };
    return result;
}