import {
    Connection,
    PublicKey,
    VersionedTransactionResponse
} from '@solana/web3.js';
import axios from 'axios';
import { SqrtPriceMath } from '@raydium-io/raydium-sdk-v2';
import RaydiumService from './raydium';
import { getSolPrice } from './getData';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

export interface TradeInfo {
    id: string;
    timestamp: string;
    type: 'BUY' | 'SELL';
    amountUsd: number;
    amountSol: number;
    txHash: string;
    price?: number;
}


export async function getTokenPrice(mintAddress: string): Promise<{ price: number; priceInSol: number }> {

    try {
        let poolId = "";
        poolId = sessionStorage.getItem(`poolId-${mintAddress}`) || "";
        if (!poolId) {
            const poolResponse = (await axios.get(`https://api.moneyglitch.fun/v1/pools/${mintAddress}`)).data;
            poolId = poolResponse.pool_id;
            sessionStorage.setItem(`poolId-${mintAddress}`, poolId);
        }
        const raydium = await RaydiumService.getInstance();
        const { computePoolInfo } = await raydium.clmm.getPoolInfoFromRpc(poolId);
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

// Define the bytes as a constant
const raydiumSwapInstructionDiscriminator = Buffer.from([0x2b, 0x04, 0xed, 0x0b, 0x1a, 0xc9, 0x1e, 0x62]);

function getRaydiumSwapInstructions(tx: VersionedTransactionResponse) {
    // Get all account keys including lookup tables
    let allAccountKeys = tx.transaction.message.staticAccountKeys;

    // Add lookup table accounts if they exist
    if ('addressTableLookups' in tx.transaction.message && tx.meta?.loadedAddresses) {
        allAccountKeys = [
            ...allAccountKeys,
            ...tx.meta.loadedAddresses.writable,
            ...tx.meta.loadedAddresses.readonly
        ];
    }

    const raydiumAccountIndex = allAccountKeys.findIndex(account =>
        account.toString() === 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'
    );

    if (raydiumAccountIndex === -1) return null;

    // Get main instructions
    const mainInstructions = tx.transaction.message.compiledInstructions
        .filter(instruction => instruction.programIdIndex === raydiumAccountIndex)
        .filter(instruction =>
            Buffer.from(instruction.data.slice(0, 8)).equals(raydiumSwapInstructionDiscriminator)
        );

    // Get inner instructions
    const innerInstructions = tx.meta?.innerInstructions?.flatMap(inner =>
        inner.instructions.filter(instruction => {
            if (instruction.programIdIndex !== raydiumAccountIndex) return false;
            return bs58.decode(instruction.data).subarray(0, 8).equals(raydiumSwapInstructionDiscriminator);
        })
    ) || [];

    return [...mainInstructions, ...innerInstructions];
}

function parseTokenTransaction(
    tx: VersionedTransactionResponse,
    tokenMintAddress: string
): TradeInfo | null {
    try {
        const swapInstructions = getRaydiumSwapInstructions(tx);
        if (!swapInstructions || swapInstructions.length === 0) return null;

        const preTokenBalances = tx.meta?.preTokenBalances || [];
        const postTokenBalances = tx.meta?.postTokenBalances || [];
        const feePayer = tx.transaction.message.staticAccountKeys[0].toString();

        // Get token balance changes
        const tokenTransfersFromPost = postTokenBalances
            .filter(post => post.mint === tokenMintAddress && post.owner === feePayer)
            .map(post => {
                const pre = preTokenBalances.find(pre =>
                    pre.accountIndex === post.accountIndex &&
                    pre.mint === post.mint
                );
                return {
                    amount: (post.uiTokenAmount.uiAmount || 0) - (pre ? pre.uiTokenAmount.uiAmount || 0 : 0),
                    tokenMint: post.mint,
                    owner: post.owner
                };
            })
            .filter(Boolean);

        const tokenTransfersFromPre = preTokenBalances
            .filter(pre => pre.mint === tokenMintAddress && pre.owner === feePayer)
            .map(pre => {
                const post = postTokenBalances.find(post =>
                    post.accountIndex === pre.accountIndex &&
                    post.mint === pre.mint
                );
                if (post) return null;  //Precessed on previous step
                return {
                    amount: -(pre.uiTokenAmount.uiAmount || 0),
                    tokenMint: pre.mint,
                    owner: pre.owner
                };
            })
            .filter(Boolean);

        const tokenTransfers = [...tokenTransfersFromPost, ...tokenTransfersFromPre];

        // Get SOL/WSOL balance changes
        const wsolTransfers = postTokenBalances
            .filter(post =>
                post.mint === 'So11111111111111111111111111111111111111112' &&
                post.owner === feePayer
            )
            .map(post => {
                const pre = preTokenBalances.find(pre =>
                    pre.accountIndex === post.accountIndex &&
                    pre.mint === post.mint
                );
                if (!pre) return null;
                return {
                    amount: (post.uiTokenAmount.uiAmount || 0) - (pre.uiTokenAmount.uiAmount || 0),
                    owner: post.owner
                };
            })
            .filter(Boolean);

        const mainTokenTransfer = tokenTransfers[0];
        const mainWsolTransfer = wsolTransfers[0];

        if (!mainTokenTransfer) return null;

        // Calculate price if both transfers exist
        const price = mainWsolTransfer && mainTokenTransfer.amount !== 0
            ? Math.abs(mainWsolTransfer.amount / mainTokenTransfer.amount)
            : tx.meta?.postBalances && tx.meta?.preBalances ? Math.abs(tx.meta?.postBalances[0] - tx.meta?.preBalances[0]) / 10 ** 9 / mainTokenTransfer.amount : undefined;

        return {
            id: tx.transaction.signatures[0],
            timestamp: tx.blockTime
                ? new Date(tx.blockTime * 1000).toLocaleString()
                : new Date().toLocaleString(),
            type: mainTokenTransfer.amount > 0 ? 'BUY' : 'SELL',
            amountUsd: 0,
            amountSol: mainWsolTransfer ? Math.abs(mainWsolTransfer.amount) : tx.meta?.postBalances ? Math.abs(tx.meta?.postBalances[0] - tx.meta?.preBalances[0]) / 10 ** 9 : 0,
            txHash: tx.transaction.signatures[0],
            price
        };
    } catch (error) {
        console.error('Error parsing Raydium swap transaction:', error);
        return null;
    }
}

export async function fetchRecentTrades(tokenMintAddress: string, poolAddress: string): Promise<TradeInfo[]> {
    try {
        // First try to get trades from API
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/trades`, {
            headers: {
                'Accept': `application/json;version=20230302`
            }
        });

        const tradesResponse = response.data.data;

        // Check if we got valid trades data
        if (tradesResponse && tradesResponse.length > 0) {
            const numTrades = Math.min(tradesResponse.length, 10); // Take up to 10 trades
            return tradesResponse.slice(0, numTrades).map((trade: any) => ({
                id: trade.attributes.tx_hash,
                timestamp: new Date(trade.attributes.block_timestamp).toLocaleString(),
                type: trade.attributes.kind.toUpperCase(),
                amountUsd: Number(trade.attributes.volume_in_usd),
                amountSol: trade.attributes.kind == 'buy' ? Number(trade.attributes.from_token_amount) : Number(trade.attributes.to_token_amount),
                txHash: trade.attributes.tx_hash,
                price: Number(trade.price_to_in_usd)
            }));
        }

        // If API failed or returned no data, fallback to connection method
        throw new Error('No trades found from API');

    } catch (error) {
        console.log('Falling back to connection method for trades');

        // Fallback to connection method
        const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
        const signatures = await connection.getSignaturesForAddress(
            new PublicKey(tokenMintAddress),
            { limit: 30 },
            "confirmed"
        );

        const recentTrades = await Promise.all(signatures.map(async (signature) => {
            const tx = await connection.getTransaction(signature.signature, { maxSupportedTransactionVersion: 0 });
            if (!tx || tx.meta?.err) return null;
            return parseTokenTransaction(tx, tokenMintAddress);
        }));

        const solPrice = await getSolPrice();
        return Promise.all(recentTrades
            .filter(trade => trade !== null)
            .map(async trade => {
                trade.amountUsd = trade.amountSol * solPrice;
                return trade;
            }));
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
                        const solPrice = await getSolPrice();
                        tradeInfo.amountUsd = tradeInfo.amountSol * solPrice;

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

export function getRelativeTime(timestamp: string): string {
    const now = new Date().getTime();
    const date = new Date(timestamp).getTime();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
} 