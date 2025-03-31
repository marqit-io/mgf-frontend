import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { getTokenPrice } from './trades';

interface Holder {
    address: string;
    tokenAccount: string;
    balance: number;
    percentage: number;
    value: number;
    transactions: number;
    unrealizedPnl: number;
    realizedPnl: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: any = {}, retries = MAX_RETRIES): Promise<any> => {
    try {
        const response = await axios.get(url, options);
        return response.data;
    } catch (error: any) {
        if (error.status == 404) {
            throw new Error("Not found");
        }
        if (retries > 0) {
            await sleep(RETRY_DELAY);
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
};

export const getTokenDataFromMintAddress = async (mintAccount: PublicKey) => {
    let tokenData: any = {};
    let tokenSolscanMetadata: any = {};
    let tokenInfoResponse: any = {};
    let metadataResponse: any = {};
    const solscanApiKey = import.meta.env.VITE_SOLSCAN_API_KEY;

    try {
        // Fetch Solscan metadata with retry
        const solscanResponse = await fetchWithRetry(
            `https://pro-api.solscan.io/v2.0/token/meta/?address=${mintAccount.toString()}`,
            { headers: { 'token': solscanApiKey } }
        );
        tokenSolscanMetadata = solscanResponse.data;
    } catch (error) {
        // Fallback to moneyglitch API if Solscan fails
        tokenInfoResponse = await fetchWithRetry(
            `https://api.moneyglitch.fun/v1/tokens/${mintAccount.toString()}`
        );
        metadataResponse = await fetchWithRetry(tokenInfoResponse.uri);
    }

    // If Solscan metadata is incomplete, fetch from moneyglitch
    if (!tokenSolscanMetadata?.name) {
        tokenInfoResponse = await fetchWithRetry(
            `https://api.moneyglitch.fun/v1/tokens/${mintAccount.toString()}`
        );
        metadataResponse = await fetchWithRetry(tokenInfoResponse.uri);
    }

    // Fetch additional data with retry
    const [poolResponse, taxInfoResponse, glitchInfo] = await Promise.all([
        fetchWithRetry(`https://api.moneyglitch.fun/v1/pools/${mintAccount.toString()}`),
        fetchWithRetry(`https://api.moneyglitch.fun/v1/fees/${mintAccount.toString()}`),
        fetchWithRetry(`https://api.moneyglitch.fun/v1/stats/token/${mintAccount.toString()}`)
    ]);

    let pairStats: any = {};

    try {
        pairStats = await fetchWithRetry(`https://solana-gateway.moralis.io/token/mainnet/pairs/${poolResponse.pool_id}/stats`, {
            headers: {
                'x-api-key': import.meta.env.VITE_MORALIS_API_KEY
            }
        }, 1);
    } catch (error) {
        console.error('Error fetching pool stats:', error);
    }

    // Fetch distribution token metadata with retry
    const distributionTokenMetadataResponse = await fetchWithRetry(
        `https://pro-api.solscan.io/v2.0/token/meta/?address=${taxInfoResponse.distribution_mint}`,
        { headers: { 'token': solscanApiKey } }
    );
    const distributionTokenMetadata = distributionTokenMetadataResponse.data;

    if (distributionTokenMetadata == null) {
        throw new Error("Distribution token metadata not found");
    }

    tokenData = {
        name: tokenSolscanMetadata?.metadata?.name || tokenSolscanMetadata?.name || tokenInfoResponse.name,
        ticker: tokenSolscanMetadata?.metadata?.symbol || tokenSolscanMetadata?.symbol || tokenInfoResponse.symbol,
        contractAddress: mintAccount.toString(),
        contractAddressShort: mintAccount.toString().slice(0, 4) + '...' + mintAccount.toString().slice(-4),
        poolAddress: poolResponse.pool_id,
        profileImage: tokenSolscanMetadata?.metadata?.image || tokenSolscanMetadata?.icon || metadataResponse.image,
        description: tokenSolscanMetadata?.metadata?.description || tokenSolscanMetadata?.description || metadataResponse.description,
        marketCap: tokenSolscanMetadata?.supply / 10 ** 6 * Number(pairStats?.currentUsdPrice) || tokenSolscanMetadata?.market_cap || 0,
        holders: tokenSolscanMetadata?.holder || 0,
        price: Number(pairStats?.currentUsdPrice) || tokenSolscanMetadata?.price || 0,
        volume24h: Number(pairStats?.totalVolume?.["24h"]) || tokenSolscanMetadata?.volume_24h || 0,
        priceChange24h: Number(pairStats?.pricePercentChange?.["24h"]).toFixed(2) || tokenSolscanMetadata?.price_change_24h || 0,
        totalSupply: tokenSolscanMetadata?.supply / 10 ** 6 || 1000000000,
        socialLinks: {
            telegram: tokenSolscanMetadata?.metadata?.extensions?.telegram || tokenSolscanMetadata?.metadata?.telegram || metadataResponse?.extensions?.telegram,
            website: tokenSolscanMetadata?.metadata?.extensions?.website || tokenSolscanMetadata?.metadata?.website || metadataResponse?.extensions?.website,
            twitter: tokenSolscanMetadata?.metadata?.extensions?.twitter || tokenSolscanMetadata?.metadata?.twitter || metadataResponse?.extensions?.twitter
        },
        taxInfo: {
            total: taxInfoResponse.fee_rate,
            burn: taxInfoResponse.burn_rate,
            glitchType: taxInfoResponse.fee_type,
            distribute: taxInfoResponse.distribution_rate,
            interval: taxInfoResponse.distribution_interval,
            distributionToken: {
                symbol: distributionTokenMetadata?.symbol || distributionTokenMetadata?.metadata?.symbol,
                name: distributionTokenMetadata?.name || distributionTokenMetadata?.metadata?.name,
                address: taxInfoResponse.distribution_mint
            },
            distributionWallet: taxInfoResponse.distribution_wallet,
            burnWallet: taxInfoResponse.burn_wallet
        },
        glitchInfo: glitchInfo.distributed_value + glitchInfo.burned_value
    };

    return tokenData;
};

// export const getTokenDataFromMintAddress = async (mintAccount: PublicKey) => {
//     let tokenData: any = {};
//     let response, poolAddress, feeInfo;

//     // First Section - Getting main infos of token
//     try {
//         axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;
//         response = (await axios.get(`https://pro-api.solscan.io/v2.0/token/meta/?address=${mintAccount.toString()}`)).data.data;

//         if (!response) throw new Error("Failed to get data using Solscan API");
//         // Set basic token data from the first API
//         tokenData = {
//             name: response.metadata?.name || response.name,
//             ticker: response.metadata?.symbol || response.symbol,
//             price: response.price,
//             marketCap: response.market_cap,
//             holders: response.holder,
//             volume24h: response.volume_24h,
//             priceChange24h: response.price_change_24h,
//             contractAddress: response.address,
//             contractAddressShort: response.address.slice(0, 4) + '...' + response.address.slice(-4),
//             profileImage: response.metadata?.image || response.icon,
//             totalSupply: response.supply,
//             socialLinks: {
//                 telegram: response.metadata?.extensions ? response.metadata?.extensions.telegram : response.metadata?.telegram,
//                 website: response.metadata?.extensions ? response.metadata?.extensions.website : response.metadata?.website,
//                 twitter: response.metadata?.extensions ? response.metadata?.extensions.twitter : response.metadata?.twitter
//             },
//             description: response.metadata?.description || response.description,
//         };
//     } catch (error) {

//         return null; // Return null if primary token data fails
//     }

//     // Second API call - pool address
//     try {
//         const wsolAddress = 'So11111111111111111111111111111111111111112';
//         poolAddress = (await axios.get(`https://pro-api.solscan.io/v2.0/token/markets/?token[]=${mintAccount.toString()}&token[]=${wsolAddress}`)).data.data.filter((item: any) => item.program_id == "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK")[0].pool_id;
//         tokenData.poolAddress = poolAddress;
//     } catch (error) {
//         console.error('Error fetching pool address:', error);
//         tokenData.poolAddress = null;
//     }

//     // Third API call - fee info
//     try {
//         feeInfo = (await axios.get(`https://api.moneyglitch.fun/v1/fees/${mintAccount.toString()}`)).data;
//         tokenData.taxInfo = {
//             total: feeInfo.fee_rate,
//             burn: feeInfo.burn_rate,
//             glitchType: feeInfo.fee_type,
//             distribute: feeInfo.distribution_rate,
//             interval: feeInfo.distribution_interval,
//             distributionToken: {
//                 symbol: 'SOL',
//                 name: 'Wrapped SOL',
//                 address: 'So11111111111111111111111111111111111111112'
//             }
//         };

//         // Fourth API call - total glitch
//         const glitchInfo = (await axios.get(`https://api.moneyglitch.fun/v1/stats/token/${mintAccount.toString()}`)).data;
//         tokenData.glitched = glitchInfo.total_value_burned + glitchInfo.total_value_distributed;
//     } catch (error) {
//         console.error('Error fetching fee info:', error);
//         tokenData.taxInfo = null;
//     }

//     return tokenData;
// };

export const getTokenTopHolders = async (mintAccount: PublicKey, totalSupply: number, price: number) => {
    axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;
    const response = (await axios.get(`https://pro-api.solscan.io/v2.0/token/holders?address=${mintAccount.toString()}&page=1&page_size=10`)).data.data.items;
    const result: Holder[] = [];

    response.forEach((item: any) => {
        result.push({
            address: item.owner,
            tokenAccount: item.address,
            balance: item.amount / 10 ** item.decimals,
            percentage: (item.amount / totalSupply / 10 ** item.decimals) * 100,
            value: item.amount / 10 ** item.decimals * price,
            transactions: 10,
            unrealizedPnl: 10,
            realizedPnl: 10
        });
    });

    return result;
};

// Add caching for frequently accessed data
const cache = {
    solPrice: { value: 0, timestamp: 0 },
    tokenData: new Map<string, { data: any, timestamp: number }>()
};

const CACHE_DURATION = 30000; // 30 seconds

// Optimized getSolPrice with caching
export async function getSolPrice(): Promise<number> {
    const now = Date.now();
    if (cache.solPrice.value && now - cache.solPrice.timestamp < CACHE_DURATION) {
        return cache.solPrice.value;
    }

    try {
        axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;
        const response = (await axios.get(`https://pro-api.solscan.io/v2.0/token/meta/?address=So11111111111111111111111111111111111111112`)).data.data;
        cache.solPrice = { value: Number(response.price), timestamp: now };
        return cache.solPrice.value;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        return 0;
    }
}

export const getSolBalance = async (publicKey: PublicKey) => {
    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
    const balance = await connection.getBalance(publicKey);
    return balance / 10 ** 9;
};

// Optimized getTokenBalance with retry and confirmation
export const getTokenBalance = async (publicKey: PublicKey, tokenMintAddress: PublicKey, maxRetries = 5): Promise<number> => {
    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
    const tokenAccount = getAssociatedTokenAddressSync(tokenMintAddress, publicKey, false, TOKEN_2022_PROGRAM_ID);

    let retries = 0;
    while (retries < maxRetries) {
        try {
            const balance = await connection.getTokenAccountBalance(tokenAccount);
            if (balance.value.uiAmount !== null) {
                return balance.value.uiAmount;
            }
        } catch (error) {
            console.warn(`Attempt ${retries + 1} failed to get token balance`);
        }

        // Exponential backoff delay
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000)));
        retries++;
    }

    throw new Error('Failed to get updated token balance after maximum retries');
};

export const getTopGlitchTokens = async () => {
    try {
        const topTokens = await fetchWithRetry(`https://api.moneyglitch.fun/v1/stats/top/total?limit=5`);
        if (!topTokens?.length) return [];

        const tokensData = await Promise.all(
            topTokens.map(async (item: any) => {
                const mintAccount = new PublicKey(item.mint);
                let tokenData: any = {};
                let tokenSolscanMetadata: any = {};
                let tokenInfoResponse: any = {};
                const solscanApiKey = import.meta.env.VITE_SOLSCAN_API_KEY;

                try {
                    // Fetch Solscan metadata with retry and custom headers
                    tokenSolscanMetadata = await fetchWithRetry(
                        `https://pro-api.solscan.io/v2.0/token/meta/?address=${mintAccount.toString()}`,
                        { headers: { 'token': solscanApiKey } }
                    );
                    tokenSolscanMetadata = tokenSolscanMetadata.data;
                } catch (error) {
                    // Fallback to moneyglitch API if Solscan fails
                    tokenInfoResponse = await fetchWithRetry(
                        `https://api.moneyglitch.fun/v1/tokens/${mintAccount.toString()}`
                    );
                }

                if (!tokenSolscanMetadata?.name) {
                    tokenInfoResponse = await fetchWithRetry(
                        `https://api.moneyglitch.fun/v1/tokens/${mintAccount.toString()}`
                    );
                }

                const taxInfoResponse = await fetchWithRetry(
                    `https://api.moneyglitch.fun/v1/fees/${mintAccount.toString()}`
                );

                // Fetch additional data with retry
                const [glitchInfo, poolInfoResponse] = await Promise.all([
                    fetchWithRetry(`https://api.moneyglitch.fun/v1/stats/token/${mintAccount.toString()}`),
                    fetchWithRetry(`https://api.moneyglitch.fun/v1/pools/${mintAccount.toString()}`)
                ]);

                let poolStats: any = {};

                try {
                    poolStats = await fetchWithRetry(
                        `https://solana-gateway.moralis.io/token/mainnet/pairs/${poolInfoResponse.pool_id}/stats`,
                        {
                            headers: {
                                'x-api-key': import.meta.env.VITE_MORALIS_API_KEY
                            }
                        },
                        1
                    );
                } catch (error) {
                    console.error('Error fetching pool stats:', error);
                }

                // Get price using getTokenPrice
                const price = await getTokenPrice(mintAccount.toString());

                tokenData = {
                    id: item.mint,
                    name: tokenSolscanMetadata?.metadata?.name || tokenSolscanMetadata?.name || tokenInfoResponse.name,
                    price: poolStats?.currentUsdPrice || price?.price || 0,
                    priceChange: poolStats?.pricePercentChange?.["24h"] || tokenSolscanMetadata?.price_change_24h || 0,
                    marketCap: poolStats?.currentUsdPrice * tokenSolscanMetadata?.supply / 10 ** 6 || tokenSolscanMetadata?.market_cap || 0,
                    volume24h: poolStats?.totalVolume?.["24h"] || tokenSolscanMetadata?.volume_24h || 0,
                    glitchesDistributed: glitchInfo.total_value_burned + glitchInfo.total_value_distributed,
                    glitchType: taxInfoResponse?.fee_type || 'NoFee',
                    tax: {
                        enabled: taxInfoResponse?.fee_type !== 'NoFee',
                        total: taxInfoResponse?.fee_rate || 0,
                        distribution: {
                            burn: taxInfoResponse?.burn_rate || 0,
                            reward: taxInfoResponse?.distribution_rate || 0
                        }
                    }
                };
                return tokenData;
            })
        );
        return tokensData;
    } catch (error) {
        console.error('Error fetching top tokens:', error);
        return [];
    }
};

// export const getTopGlitchTokens = async () => {
//     axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;

//     try {
//         // Fetch all tokens in one call
//         const topTokens = (await axios.get(`https://api.moneyglitch.fun/v1/stats/top/total?limit=5`)).data;
//         if (!topTokens?.length) return [];

//         // Fetch data for all tokens in parallel
//         const tokensData = await Promise.all(
//             topTokens.map(async (item: any) => {
//                 let tokenMetadata = null;
//                 let feeData = null;

//                 try {
//                     tokenMetadata = (await axios.get(`https://pro-api.solscan.io/v2.0/token/meta/?address=${item.mint}`)).data.data;
//                 } catch (error) {
//                     console.error(`Error fetching token metadata for ${item.mint}:`, error);
//                 }

//                 try {
//                     feeData = (await axios.get(`https://api.moneyglitch.fun/v1/fees/${item.mint}`)).data;
//                 } catch (error) {
//                     console.error(`Error fetching fee data for ${item.mint}:`, error);
//                 }

//                 return {
//                     id: item.mint,
//                     name: tokenMetadata?.name || tokenMetadata?.metadata?.name || item.token_name,
//                     price: tokenMetadata?.price || 0,
//                     priceChange: tokenMetadata.price_change_24h,
//                     marketCap: tokenMetadata?.market_cap || 0,
//                     volume24h: tokenMetadata?.volume_24h || 0,
//                     glitchesDistributed: item.total_value_burned + item.total_value_distributed,
//                     glitchType: feeData?.fee_type || 'NoFee',
//                     tax: {
//                         enabled: feeData?.fee_type !== 'NoFee',
//                         total: feeData?.fee_rate || 0,
//                         distribution: {
//                             burn: feeData?.burn_rate || 0,
//                             reward: feeData?.distribution_rate || 0
//                         }
//                     }
//                 };
//             })
//         );

//         return tokensData;
//     } catch (error) {
//         console.error('Error fetching top tokens:', error);
//         return [];
//     }
// };

export const getTotalStats = async () => {
    const response = (await axios.get(`https://api.moneyglitch.fun/v1/stats/platform`)).data;
    return response;
};
/*
export async function getTokenMetadata(connection: Connection, mint: PublicKey) {
     When token is TOKEN-2022 this code does not work. Need to use API on Mainnet
    try {
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
                mint.toBuffer(),
            ],
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
        );

        const metadataAccount = await connection.getAccountInfo(metadataAddress);
        if (!metadataAccount) {
            throw new Error('Metadata account not found');
        }

        const metadata = Metadata.deserialize(metadataAccount.data)[0];
        return metadata;
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        return null;
    }
    

return {
    data: {
        name: "Wrapped SOL",
        symbol: "SOL",
    }
}
}
*/