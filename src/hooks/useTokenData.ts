import { useContext, useMemo } from 'react';
import { TokenContext } from '../context/TokenContext';

export function useTokenData() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenData must be used within a TokenProvider');
  }

  const { state, connect, disconnect, isConnected } = context;

  const sortedTokens = useMemo(() => {
    return Object.values(state.tokens).sort((a, b) => b.marketCap - a.marketCap);
  }, [state.tokens]);

  const stats = useMemo(() => {
    return {
      totalMarketCap: sortedTokens.reduce((sum, token) => sum + token.marketCap, 0),
      totalVolume24h: sortedTokens.reduce((sum, token) => sum + token.volume24h, 0),
      totalHolders: sortedTokens.reduce((sum, token) => sum + token.holders, 0),
      averagePrice: sortedTokens.length
        ? sortedTokens.reduce((sum, token) => sum + token.price, 0) / sortedTokens.length
        : 0,
    };
  }, [sortedTokens]);

  return {
    tokens: sortedTokens,
    stats,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    connect,
    disconnect,
    isConnected,
  };
}