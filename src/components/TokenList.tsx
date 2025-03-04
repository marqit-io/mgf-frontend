import React from 'react';
import { useTokenData } from '../hooks/useTokenData';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function TokenList() {
  const { tokens, isLoading, error, connect, isConnected } = useTokenData();

  React.useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  if (error) {
    return (
      <div className="terminal-card p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="terminal-card p-4">
        <p className="terminal-text">Loading token data...</p>
      </div>
    );
  }

  return (
    <div className="terminal-card p-4">
      <h2 className="terminal-header mb-4">&gt; ACTIVE_PROTOCOLS</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="terminal-dim pb-2">&gt; TOKEN</th>
              <th className="terminal-dim pb-2">&gt; PRICE</th>
              <th className="terminal-dim pb-2">&gt; HOLDERS</th>
              <th className="terminal-dim pb-2">&gt; REVENUE</th>
              <th className="terminal-dim pb-2">&gt; 24H</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(token => (
              <tr key={token.id} className="border-t border-[#00ff00]/20">
                <td className="py-2">{token.name}</td>
                <td className="py-2">{formatCurrency(token.price)}</td>
                <td className="py-2">{formatNumber(token.holders)}</td>
                <td className="py-2">{formatCurrency(token.revenue)}</td>
                <td className="py-2">
                  <span className={token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}