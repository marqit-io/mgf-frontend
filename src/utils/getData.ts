import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import axios from 'axios';

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

export const getTokenDataFromMintAddress = async (mintAccount: PublicKey) => {
    let tokenData: any = {};
    let response, poolAddress, feeInfo;

    // First API call - token metadata
    try {
        axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;
        response = (await axios.get(`https://pro-api.solscan.io/v2.0/token/meta/?address=${mintAccount.toString()}`)).data.data;

        // Set basic token data from the first API
        tokenData = {
            name: response.metadata.name,
            ticker: response.metadata.symbol,
            price: response.price,
            marketCap: response.market_cap,
            holders: response.holder,
            volume24h: response.volume_24h,
            glitched: '$989,250',
            priceChange24h: response.price_change_24h,
            contractAddress: response.address,
            contractAddressShort: response.address.slice(0, 4) + '...' + response.address.slice(-4),
            profileImage: response.metadata.image,
            totalSupply: response.supply,
            socialLinks: {
                telegram: response.metadata.extensions ? response.metadata.extensions.telegram : response.metadata.telegram,
                website: response.metadata.extensions ? response.metadata.extensions.website : response.metadata.website,
                twitter: response.metadata.extensions ? response.metadata.extensions.twitter : response.metadata.twitter
            },
            description: response.metadata.description,
        };
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        return null; // Return null if primary token data fails
    }

    // Second API call - pool address
    try {
        const wsolAddress = 'So11111111111111111111111111111111111111112';
        poolAddress = (await axios.get(`https://pro-api.solscan.io/v2.0/token/markets/?token[]=${mintAccount.toString()}&token[]=${wsolAddress}`)).data.data[0].pool_id;
        tokenData.poolAddress = poolAddress;
    } catch (error) {
        console.error('Error fetching pool address:', error);
        tokenData.poolAddress = null;
    }

    // Third API call - fee info
    try {
        feeInfo = (await axios.get(`https://api.moneyglitch.fun/v1/fees/${mintAccount.toString()}`)).data;
        tokenData.taxInfo = {
            total: feeInfo.fee_rate,
            burn: feeInfo.burn_rate,
            glitchType: feeInfo.fee_type,
            distribute: feeInfo.distribution_rate,
            interval: feeInfo.distribution_interval,
            distributionToken: {
                symbol: 'SOL',
                name: 'Wrapped SOL',
                address: 'So11111111111111111111111111111111111111112'
            }
        };
    } catch (error) {
        console.error('Error fetching fee info:', error);
        tokenData.taxInfo = null;
    }

    return tokenData;
};

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

export const getSolPrice = async () => {
    axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;
    const response = (await axios.get(`https://pro-api.solscan.io/v2.0/token/price?address=So11111111111111111111111111111111111111112`)).data.data[0].price;
    return response;
};

export const getSolBalance = async (publicKey: PublicKey) => {
    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
    const balance = await connection.getBalance(publicKey);
    return balance / 10 ** 9;
};

export const getTokenBalance = async (publicKey: PublicKey, tokenMintAddress: PublicKey) => {
    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
    const tokenAccount = getAssociatedTokenAddressSync(tokenMintAddress, publicKey);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return balance.value.uiAmount || 0;
};

export const getTokenHistoricalPrice = async (poolAddress: PublicKey, range: '24h' | '7d' | '30d' | '90d' = '7d') => {
    try {
        axios.defaults.headers.common['X-API-KEY'] = import.meta.env.VITE_MORALIS_API_KEY;

        // Calculate date range and determine timeframe based on range
        const toDate = new Date();
        const fromDate = new Date();
        let timeframe: string;

        switch (range) {
            case '24h':
                fromDate.setHours(fromDate.getHours() - 24);
                timeframe = '30min';
                break;
            case '7d':
                fromDate.setDate(fromDate.getDate() - 7);
                timeframe = '4h';
                break;
            case '30d':
                fromDate.setDate(fromDate.getDate() - 30);
                timeframe = '12h';
                break;
            case '90d':
                fromDate.setDate(fromDate.getDate() - 90);
                timeframe = '1d';
                break;
            default:
                fromDate.setDate(fromDate.getDate() - 7);
                timeframe = '4h';
        }

        const response = await axios.get(
            `https://solana-gateway.moralis.io/token/mainnet/pairs/${poolAddress.toString()}/ohlcv`,
            {
                params: {
                    timeframe,
                    currency: 'usd',
                    fromDate: fromDate.toISOString().split('T')[0],
                    toDate: toDate.toISOString().split('T')[0],
                    limit: 100
                }
            }
        );

        if (!response.data?.result || !Array.isArray(response.data.result)) {
            throw new Error('Invalid response format from API');
        }

        // Transform and validate the data
        return response.data.result
            .map((item: any) => ({
                time: Math.floor(new Date(item.timestamp).getTime() / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume)
            }))
            .sort((a: { time: number }, b: { time: number }) => a.time - b.time); // Ensure data is sorted by time
    } catch (error) {
        console.error('Error fetching historical price data:', error);
        return [];
    }
};

export const getTopGlitchTokens = async () => {
    axios.defaults.headers.common['token'] = import.meta.env.VITE_SOLSCAN_API_KEY;

    try {
        // Fetch all tokens in one call
        const topTokens = (await axios.get(`https://api.moneyglitch.fun/v1/stats/top/total?limit=5`)).data;
        if (!topTokens?.length) return [];

        // Fetch data for all tokens in parallel
        const tokensData = await Promise.all(
            topTokens.map(async (item: any) => {
                let tokenMetadata = null;
                let feeData = null;

                try {
                    tokenMetadata = (await axios.get(`https://pro-api.solscan.io/v2.0/token/meta/?address=${item.mint}`)).data.data;
                } catch (error) {
                    console.error(`Error fetching token metadata for ${item.mint}:`, error);
                }

                try {
                    feeData = (await axios.get(`https://api.moneyglitch.fun/v1/fees/${item.mint}`)).data;
                } catch (error) {
                    console.error(`Error fetching fee data for ${item.mint}:`, error);
                }

                return {
                    id: item.mint,
                    name: tokenMetadata?.name || tokenMetadata?.metadata?.name || item.token_name,
                    price: tokenMetadata?.price || 0,
                    priceChange: tokenMetadata.price_change_24h,
                    marketCap: tokenMetadata?.market_cap || 0,
                    volume24h: tokenMetadata?.volume_24h || 0,
                    glitchesDistributed: item.total_value_burned + item.total_value_distributed,
                    glitchType: feeData?.fee_type || 'NoFee',
                    tax: {
                        enabled: feeData?.fee_type !== 'NoFee',
                        total: feeData?.fee_rate || 0,
                        distribution: {
                            burn: feeData?.burn_rate || 0,
                            reward: feeData?.distribution_rate || 0
                        }
                    }
                };
            })
        );

        return tokensData;
    } catch (error) {
        console.error('Error fetching top tokens:', error);
        return [];
    }
};

export const getTotalStats = async () => {
    const response = (await axios.get(`https://api.moneyglitch.fun/v1/stats/platform`)).data;
    return response;
};
