import {
    Connection,
    PublicKey,
    VersionedTransactionResponse
} from '@solana/web3.js';
import axios from 'axios';
import { getSolPrice } from './getData';
import { initializeRaydium } from './instructionBuilders';
import { SqrtPriceMath } from '@raydium-io/raydium-sdk-v2';

export interface TradeInfo {
    id: string;
    timestamp: string;
    type: 'BUY' | 'SELL';
    amountUsd: number;
    amountSol: number;
    txHash: string;
}


export async function getTokenPrice(mintAddress: string): Promise<{ price: number; priceInSol: number }> {

    try {
        const poolResponse = (await axios.get(`https://api.moneyglitch.fun/v1/pools/${mintAddress}`)).data;
        const raydium = await initializeRaydium();
        const { computePoolInfo } = await raydium.clmm.getPoolInfoFromRpc(poolResponse.pool_id.toString());
        const priceInSol = SqrtPriceMath.sqrtPriceX64ToPrice(
            computePoolInfo.sqrtPriceX64,
            6, // Token decimals (usually 6 for custom tokens)
            9  // WSOL decimals
        );
        const solPrice = await getSolPrice();
        return { price: Number(priceInSol) * solPrice, priceInSol: Number(priceInSol) };
    } catch (error) {
        console.error('Error fetching token price:', error);
        return { price: 0, priceInSol: 0 };
    }
}

function parseTokenTransaction(
    tx: VersionedTransactionResponse,
    tokenMintAddress: string
): TradeInfo | null {
    try {
        const preTokenBalances = tx.meta?.preTokenBalances || [];
        const postTokenBalances = tx.meta?.postTokenBalances || [];

        // Find relevant token transfers
        const tokenTransfers = postTokenBalances
            .filter(post => post.mint === tokenMintAddress)
            .map(post => {
                const pre = preTokenBalances.find(
                    pre => pre.accountIndex === post.accountIndex && pre.mint === post.mint
                );

                const amount = (Number(post.uiTokenAmount.amount) -
                    Number(pre?.uiTokenAmount.amount || 0)) /
                    Math.pow(10, post.uiTokenAmount.decimals);

                return {
                    amount,
                    owner: post.owner || ''
                };
            })
            .filter(transfer => transfer.amount !== 0);

        if (tokenTransfers.length === 0) return null;

        // Get the fee payer's address
        const feePayer = tx.transaction.message.staticAccountKeys[0].toString();

        // Find fee payer's transfers
        const feePayerTransfers = tokenTransfers.filter(transfer => transfer.owner === feePayer);

        // Find the transfer with the largest absolute amount among fee payer's transfers
        const mainTransfer = feePayerTransfers.reduce((max, transfer) =>
            Math.abs(transfer.amount) > Math.abs(max.amount) ? transfer : max
            , feePayerTransfers[0]);

        // If no matching transfer is found, return null
        if (!mainTransfer) return null;

        // Determine if this is a buy or sell
        const type = mainTransfer.amount > 0 ? 'BUY' : 'SELL';

        return {
            id: tx.transaction.signatures[0],
            timestamp: new Date().toISOString(),
            type,
            amountUsd: Math.abs(mainTransfer.amount), // Will be multiplied by price later
            amountSol: 0,
            txHash: tx.transaction.signatures[0]
        };
    } catch (error) {
        console.error('Error parsing transaction:', error);
        return null;
    }
}

export async function fetchRecentTrades(tokenMintAddress: string): Promise<TradeInfo[]> {
    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
    const signatures = await connection.getSignaturesForAddress(new PublicKey(tokenMintAddress), { limit: 10 }, "confirmed");
    const recentTrades = await Promise.all(signatures.map(async (signature) => {
        const tx = await connection.getTransaction(signature.signature, { maxSupportedTransactionVersion: 0 });
        if (!tx) return null;
        return parseTokenTransaction(tx, tokenMintAddress);
    }));
    return Promise.all(recentTrades.filter(trade => trade !== null).map(async trade => {
        const priceInfo = await getTokenPrice(tokenMintAddress);
        trade.amountSol = trade.amountUsd * priceInfo.priceInSol;
        trade.amountUsd *= priceInfo.price;
        return trade;
    }));
}

export function subscribeToTokenTrades(
    tokenMintAddress: string,
    onTrade: (trade: TradeInfo) => void
) {
    const connection = new Connection(
        import.meta.env.VITE_RPC_ENDPOINT,
        'confirmed'
    );

    let lastProcessedSignature: string | undefined;

    // Subscribe to all confirmed transactions
    const subscriptionId = connection.onLogs(
        new PublicKey(tokenMintAddress),
        async (logsInfo) => {
            // Extract signature from logs
            const signature = logsInfo.signature;

            // Avoid processing the same transaction twice
            if (lastProcessedSignature === signature) return;
            lastProcessedSignature = signature;

            try {
                const tx = await connection.getTransaction(signature, {
                    maxSupportedTransactionVersion: 0
                });

                if (tx) {
                    const tradeInfo = parseTokenTransaction(tx, tokenMintAddress);
                    if (tradeInfo) {
                        const priceInfo = await getTokenPrice(tokenMintAddress);
                        tradeInfo.amountSol = tradeInfo.amountUsd * priceInfo.priceInSol;
                        tradeInfo.amountUsd *= priceInfo.price;

                        onTrade(tradeInfo);
                    }
                }
            } catch (error) {
                console.error('Error processing transaction:', error);
            }
        },
        'confirmed'
    );

    return () => {
        connection.removeOnLogsListener(subscriptionId);
    };
} 