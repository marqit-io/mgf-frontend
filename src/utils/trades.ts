import {
    Connection,
    PublicKey,
    VersionedTransactionResponse
} from '@solana/web3.js';
import axios from 'axios';
import { getSolPrice } from './getData';

export interface TradeInfo {
    id: string;
    timestamp: string;
    type: 'BUY' | 'SELL';
    amountUsd: number;
    amountSol: number;
    txHash: string;
}

// Cache token prices for 30 seconds
const priceCache = new Map<string, { price: number; timestamp: number }>();
const PRICE_CACHE_DURATION = 30000; // 30 seconds

async function getTokenPrice(mintAddress: string): Promise<number> {
    const cached = priceCache.get(mintAddress);
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_DURATION) {
        return cached.price;
    }

    try {
        const response = await axios.get(
            `https://pro-api.solscan.io/v2.0/token/price?address=${mintAddress}`,
            { headers: { token: import.meta.env.VITE_SOLSCAN_API_KEY } }
        );

        const price = response.data.data[0].price;
        priceCache.set(mintAddress, { price, timestamp: Date.now() });
        return price;
    } catch (error) {
        console.error('Error fetching token price:', error);
        return cached?.price || 0;
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
                        // Get current token price
                        const price = await getTokenPrice(tokenMintAddress);
                        const solPrice = await getSolPrice();
                        // Update USD amount with current price
                        tradeInfo.amountUsd *= price;
                        tradeInfo.amountSol = tradeInfo.amountUsd / solPrice;

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