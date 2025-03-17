import { Connection, PublicKey } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { SqrtPriceMath } from "@raydium-io/raydium-sdk-v2"
import { initializeRaydium } from './instructionBuilders';

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

export const changeGateway = (url: string) => {
    return url.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/');
}

export const getTokenDataFromMintAddress = async (mintAccount: PublicKey) => {
    let tokenData: any = {};
    const tokenInfoResponse = (await axios.get(`https://api.moneyglitch.fun/v1/tokens/${mintAccount.toString()}`)).data;
    const poolResponse = (await axios.get(`https://api.moneyglitch.fun/v1/pools/${mintAccount.toString()}`)).data;
    const metadataResponse = (await axios.get(changeGateway(tokenInfoResponse.uri))).data;
    const taxInfoResponse = (await axios.get(`https://api.moneyglitch.fun/v1/fees/${mintAccount.toString()}`)).data;
    const glitchInfo = (await axios.get(`https://api.moneyglitch.fun/v1/stats/token/${mintAccount.toString()}`)).data;

    tokenData = {
        name: tokenInfoResponse.name,
        ticker: tokenInfoResponse.symbol,
        contractAddress: mintAccount.toString(),
        contractAddressShort: mintAccount.toString().slice(0, 4) + '...' + mintAccount.toString().slice(-4),
        poolAddress: poolResponse.pool_id,
        profileImage: changeGateway(metadataResponse.image),
        description: metadataResponse.description,
        socialLinks: metadataResponse.attributes.socialLinks,
        taxInfo: {
            total: taxInfoResponse.fee_rate,
            burn: taxInfoResponse.burn_rate,
            glitchType: taxInfoResponse.fee_type,
            distribute: taxInfoResponse.distribution_rate,
            interval: taxInfoResponse.distribution_interval,
            distributionToken: {
                symbol: 'SOL',
                name: 'Wrapped SOL',
                address: 'So11111111111111111111111111111111111111112'
            }
        },
        glitchInfo: glitchInfo.distributed_value + glitchInfo.burned_value
    }
    return tokenData;
}

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

    console.log(response);

    response.forEach((item: any) => {
        result.push({
            address: item.owner,
            tokenAccount: item.address,
            balance: item.amount / 10 ** item.decimals,
            percentage: (item.amount / totalSupply) * 100,
            value: item.amount / 10 ** item.decimals * price,
            transactions: 10,
            unrealizedPnl: 10,
            realizedPnl: 10
        });
    });

    return result;
};

export async function getSolPrice(): Promise<number> {
    try {
        axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;
        const response = (await axios.get(`https://pro-api.solscan.io/v2.0/token/meta/?address=So11111111111111111111111111111111111111112`)).data.data;
        return Number(response.price);
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

export const getTokenBalance = async (publicKey: PublicKey, tokenMintAddress: PublicKey) => {
    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
    const tokenAccount = getAssociatedTokenAddressSync(tokenMintAddress, publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return balance.value.uiAmount || 0;
};

export const getTopGlitchTokens = async () => {
    try {
        // Fetch all tokens in one call
        const topTokens = (await axios.get(`https://api.moneyglitch.fun/v1/stats/top/total?limit=5`)).data;
        if (!topTokens?.length) return [];

        // Fetch data for all tokens in parallel
        const tokensData = await Promise.all(
            topTokens.map(async (item: any) => {

                const tokenInfoResponse = (await axios.get(`https://api.moneyglitch.fun/v1/tokens/${item.mint}`)).data;
                const poolResponse = (await axios.get(`https://api.moneyglitch.fun/v1/pools/${item.mint}`)).data;
                const taxInfoResponse = (await axios.get(`https://api.moneyglitch.fun/v1/fees/${item.mint}`)).data;
                const raydium = await initializeRaydium();
                const { computePoolInfo } = await raydium.clmm.getPoolInfoFromRpc(poolResponse.pool_id.toString());
                const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
                    computePoolInfo.sqrtPriceX64,
                    6, // Token decimals (usually 6 for custom tokens)
                    9  // WSOL decimals
                );
                // Get SOL price to convert to USD
                const solPrice = await getSolPrice();
                const priceInUsd = Number(currentPrice) * solPrice;
                const glitchInfo = (await axios.get(`https://api.moneyglitch.fun/v1/stats/token/${item.mint}`)).data;

                return {
                    id: item.mint,
                    name: tokenInfoResponse.name,
                    price: priceInUsd || 0,
                    priceChange: 0,
                    marketCap: 0,
                    volume24h: 0,
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
            })
        );
        console.log(tokensData);
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
