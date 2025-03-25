import { useState } from 'react';
import { LineChart, Users, Sparkles, Timer, Flame, Gift, ExternalLink, Wallet } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TokenStatsOverviewProps {
  stats: {
    marketCap: number;
    holders: number;
    volume24h: number;
    glitched: number;
    glitchType: string;
  };
  taxInfo: {
    total: number;
    burn: number;
    distribute: number;
    interval: number;
    distributionToken?: {
      symbol: string;
      name: string;
      address: string;
    };
    distributionWallet?: string;
    burnWallet?: string;
  };
}

export function TokenStatsOverview({ stats, taxInfo }: TokenStatsOverviewProps) {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getDistributionColor = (type: string) => {
    switch (type) {
      case 'BURN': return 'text-red-400';
      case 'REWARD': return 'text-green-400';
      case 'MIX': return 'text-yellow-400';
      default: return 'text-[#00ff00]';
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value && value !== 0) return '--';
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const convertBps2Percent = (value: number) => {
    return `${value / 100}%`
  }

  const formatInterval = (seconds: number | null | undefined): string => {
    if (!seconds) return '--';

    if (seconds < 60) return `${seconds} Seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} Minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} Hours`;
    return `${Math.floor(seconds / 86400)} Days`;
  };

  const getSolscanTokenUrl = (address: string) => {
    return `https://solscan.io/token/${address}`;
  };

  const getSolscanAddressUrl = (address: string) => {
    return `https://solscan.io/account/${address}`;
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const showTooltip = (content: string | undefined, event: React.MouseEvent) => {
    if (!content) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right,
      y: rect.y - 10
    });
    setTooltipContent(content);
  };

  const hideTooltip = () => {
    setTooltipContent(null);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Market Cap */}
          <div className="terminal-card bg-gradient-to-br from-black to-[#001100] p-4 border-2 border-[#00ff00]/30 hover:border-[#00ff00]/50 shadow-[0_0_20px_rgba(0,255,0,0.1)] hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] transition-all duration-300 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <LineChart size={20} className="text-[#00ff00] transform group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="text-sm opacity-50 group-hover:opacity-70 transition-opacity">Market Cap</div>
                  <div className="text-lg font-bold text-shadow-green">{stats.marketCap ? formatCurrency(stats.marketCap) : '--'}</div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-[#00ff00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Holders */}
          <div className="terminal-card bg-gradient-to-br from-black to-[#001100] p-4 border-2 border-[#00ff00]/30 hover:border-[#00ff00]/50 shadow-[0_0_20px_rgba(0,255,0,0.1)] hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] transition-all duration-300 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-[#00ff00] transform group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="text-sm opacity-50 group-hover:opacity-70 transition-opacity">Holders</div>
                  <div className="text-lg font-bold text-shadow-green">{stats.holders}</div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-[#00ff00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* 24h Volume */}
          <div className="terminal-card bg-gradient-to-br from-black to-[#001100] p-4 border-2 border-[#00ff00]/30 hover:border-[#00ff00]/50 shadow-[0_0_20px_rgba(0,255,0,0.1)] hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] transition-all duration-300 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <LineChart size={20} className="text-[#00ff00] transform group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="text-sm opacity-50 group-hover:opacity-70 transition-opacity">24h Volume</div>
                  <div className="text-lg font-bold text-shadow-green">{stats.volume24h ? formatCurrency(stats.volume24h) : '--'}</div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-[#00ff00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Glitched */}
          <div className="terminal-card bg-gradient-to-br from-black to-[#001100] p-4 border-2 border-[#00ff00]/30 hover:border-[#00ff00]/50 shadow-[0_0_20px_rgba(0,255,0,0.1)] hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] transition-all duration-300 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-[#00ff00] transform group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="text-sm opacity-50 group-hover:opacity-70 transition-opacity">GLITCHED</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-shadow-green">{stats.glitched ? formatCurrency(stats.glitched) : '--'}</span>
                    <span className={`text-xs font-bold ${getDistributionColor(stats.glitchType)} ${stats.glitchType === 'MIX' ? 'glow-yellow' : ''
                      }`}>
                      {stats.glitchType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-[#00ff00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Special glow effect for MIX type */}
            {stats.glitchType === 'MIX' && (
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at center, rgba(255, 255, 0, 0.1) 0%, transparent 70%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            )}
          </div>
        </div>

        {/* Tax Configuration Section */}
        <div className="terminal-card bg-gradient-to-br from-[#001a00] to-black border-2 border-[#00ff00]/30 shadow-[0_0_30px_rgba(0,255,0,0.1)] p-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 255, 0, 0.2) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent 0px, transparent 10px, rgba(0, 255, 0, 0.1) 10px, rgba(0, 255, 0, 0.1) 20px)'
            }}
          />

          <div className="relative z-10">
            <h2 className="terminal-header text-xl mb-6 flex items-center gap-2">
              <Timer size={20} className="text-[#00ff00]" />
              <span>&gt; TAX_CONFIGURATION</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="terminal-card bg-black/40 p-4 border border-[#00ff00]/20 hover:border-[#00ff00]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,0,0.1)] relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="text-[#00ff00]" />
                      <span className="text-sm">Total Tax</span>
                    </div>
                    <span className="text-[#00ff00] font-mono">{taxInfo.total ? convertBps2Percent(taxInfo.total) : '--'}</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ff00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="terminal-card bg-black/40 p-4 border border-[#00ff00]/20 hover:border-red-400/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.1)] relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-red-400" />
                      <span className="text-sm">Burn Rate</span>
                    </div>
                    <span className="text-red-400 font-mono">{taxInfo.burn ? convertBps2Percent(taxInfo.burn) : '--'}</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="terminal-card bg-black/40 p-4 border border-[#00ff00]/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,0,0.1)] relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-green-400" />
                      <span className="text-sm">Reward Rate</span>
                    </div>
                    <span className="text-green-400 font-mono">{taxInfo.distribute ? convertBps2Percent(taxInfo.distribute) : '--'}</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="terminal-card bg-black/40 p-4 border border-[#00ff00]/20 hover:border-[#00ff00]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,0,0.1)] relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="text-[#00ff00]" />
                      <span className="text-sm">Interval</span>
                    </div>
                    <span className="text-[#00ff00] font-mono">{taxInfo.interval ? formatInterval(taxInfo.interval) : '--'}</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ff00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Distribution Token */}
              {taxInfo.distributionToken && (
                <div className="terminal-card bg-black/40 p-4 border border-[#00ff00]/20 hover:border-[#00ff00]/40 transition-all duration-300 sm:col-span-2 lg:col-span-4 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-green-400" />
                        <span className="text-sm">Distribution Token</span>
                      </div>
                      <a
                        href={getSolscanTokenUrl(taxInfo.distributionToken.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-[#00ff00] transition-colors"
                      >
                        <span className="font-mono">{taxInfo.distributionToken.symbol}</span>
                        <span className="text-sm opacity-70">({taxInfo.distributionToken.name})</span>
                        <ExternalLink size={12} className="opacity-50" />
                      </a>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00ff00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Distribution Wallet */}
              {taxInfo.distribute > 0 && taxInfo.distributionWallet && (
                <div className="terminal-card bg-black/40 p-4 border border-[#00ff00]/20 hover:border-[#00ff00]/40 transition-all duration-300 sm:col-span-2 lg:col-span-4 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-[#00ff00]" />
                        <span className="text-sm">Distribution Wallet</span>
                      </div>
                      <div className="relative">
                        <a
                          href={getSolscanAddressUrl(taxInfo.distributionWallet)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-[#00ff00] transition-colors font-mono"
                          onMouseEnter={(e) => showTooltip(taxInfo.distributionWallet, e)}
                          onMouseLeave={hideTooltip}
                        >
                          {formatWalletAddress(taxInfo.distributionWallet)}
                          <ExternalLink size={12} className="opacity-50" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00ff00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Distribution Wallet */}
              {taxInfo.burn > 0 && taxInfo.burnWallet && (
                <div className="terminal-card bg-black/40 p-4 border border-[#00ff00]/20 hover:border-[#00ff00]/40 transition-all duration-300 sm:col-span-2 lg:col-span-4 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-[#00ff00]" />
                        <span className="text-sm">Distribution Wallet</span>
                      </div>
                      <div className="relative">
                        <a
                          href={getSolscanAddressUrl(taxInfo.burnWallet)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-[#00ff00] transition-colors font-mono"
                          onMouseEnter={(e) => showTooltip(taxInfo.burnWallet, e)}
                          onMouseLeave={hideTooltip}
                        >
                          {formatWalletAddress(taxInfo.burnWallet)}
                          <ExternalLink size={12} className="opacity-50" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00ff00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {tooltipContent && createPortal(
        <div
          className="fixed bg-black border border-[#00ff00]/20 rounded text-xs whitespace-nowrap p-2 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateY(-100%) translateX(-100%)',
            zIndex: 9999
          }}
        >
          {tooltipContent}
        </div>,
        document.body
      )}

      <style>
        {`
          .text-shadow-green {
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
          }
          
          .glow-yellow {
            text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
          }

          @keyframes pulse {
            0% { opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { opacity: 0.3; }
          }
        `}
      </style>
    </>
  );
}