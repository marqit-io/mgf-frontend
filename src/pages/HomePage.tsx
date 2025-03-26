import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, LineChart, Sparkles, Zap, Timer, Flame, Gift, ChevronDown, ChevronUp, ArrowUpRight, Twitter } from 'lucide-react';
import { getTopGlitchTokens, getTotalStats } from '../utils/getData';
import { fetchMintTransactions, MintInfo, subscribeToTokenMints } from '../utils/mintLiveFeed';
import { RelativeTime } from '../components/RelativeTime';

function HomePage() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('24h');
  const [sortBy, setSortBy] = useState('glitches');
  const [glitchType, setGlitchType] = useState<'ALL' | 'BURN' | 'REWARD' | 'MIX' | 'NONE'>('ALL');
  const [liveFeed, setLiveFeed] = useState<MintInfo[]>([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState<any>(null);
  const [totalStatsLoading, setTotalStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLiveFeedLoading, setIsLiveFeedLoading] = useState(true);

  const timeframes = [
    { value: '24h', label: '24HR', icon: LineChart },
  ];

  const sortOptions = [
    { value: 'marketCap', label: 'MARKET CAP', icon: LineChart },
    { value: 'volume24h', label: 'VOLUME', icon: LineChart },
    { value: 'glitches', label: 'GLITCHES', icon: Sparkles }
  ];

  const glitchTypes = [
    { value: 'ALL', label: 'ALL', icon: Sparkles, color: 'text-[#00ff00]' },
    { value: 'BURN', label: 'BURN', icon: Flame, color: 'text-red-400' },
    { value: 'REWARD', label: 'REWARD', icon: Gift, color: 'text-green-400' },
    { value: 'MIX', label: 'MIX', icon: Sparkles, color: 'text-yellow-400' }
  ];

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const data = await getTopGlitchTokens();
        setTokens(data);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setTokens([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    const fetchLatestMints = async () => {
      try {
        setIsLiveFeedLoading(true);
        const mints = await fetchMintTransactions(30, 0);
        setLiveFeed(mints);
      } catch (error) {
        console.error('Error fetching mint transactions', error);
      } finally {
        setIsLiveFeedLoading(false);
      }
    }

    fetchLatestMints();
    fetchTokens();
  }, []);

  useEffect(() => {
    const fetchTotalStats = async () => {
      try {
        const data = await getTotalStats();
        setTotalStats(data);
      } catch (error) {
        console.error('Error fetching total stats:', error);
        setTotalStats(null);
      } finally {
        setTotalStatsLoading(false);
      }
    };

    fetchTotalStats();
  }, []);

  useEffect(() => {
    const unSubscribe = subscribeToTokenMints((mint: MintInfo) => {
      setLiveFeed(prev => [...prev, mint].slice(0, 30));
    });

    return unSubscribe;
  }, []);

  const getActionColor = (token: typeof tokens[0]) => {
    switch (token.glitchType) {
      case "Distribute": return 'text-green-400';
      case "Burn": return 'text-red-400';
      case "Both": return 'text-yellow-400';
      default: return 'text-[#00ff00] opacity-70';
    }
  };

  const getActionIcon = (token: typeof tokens[0]) => {
    switch (token.glitchType) {
      case "Distribute": return <Gift size={14} className="text-green-400" />;
      case "Burn": return <Flame size={14} className="text-red-400" />;
      case "Both": return <Sparkles size={14} className="text-yellow-400" />;
      default: return <Timer size={14} className="text-[#00ff00] opacity-70" />;
    }
  };

  const getActionLabel = (token: typeof tokens[0]) => {
    switch (token.glitchType) {
      case 'Distribute':
        return 'REWARD';
      case 'Burn':
        return 'BURN';
      case 'Both':
        return 'MIX';
      default:
        return 'NONE';
    }
  };

  const formatCurrency = (value: number, fractionDigits: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: fractionDigits
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const sortAndFilterTokens = (tokens: any[]) => {
    const filteredTokens = glitchType === 'ALL'
      ? tokens
      : glitchType === 'NONE'
        ? tokens.filter(token => !token.tax?.enabled)
        : tokens.filter(token => {
          if (!token.tax?.enabled) return false;
          return getActionLabel(token) === glitchType;
        });

    return [...filteredTokens].sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return b.marketCap - a.marketCap;
        case 'volume24h':
          return b.volume24h - a.volume24h;
        case 'glitches':
          return b.glitchesDistributed - a.glitchesDistributed;
        default:
          return 0;
      }
    });
  };

  const handleTokenClick = (tokenId: number) => {
    navigate(`/token/${tokenId}`);
  };

  const formatTime = (timestamp: number) => {
    console.log(timestamp);
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getTaxDistributionLabel = (tax: { enabled: boolean, total: number, distribution: { burn: number, reward: number } }) => {
    if (!tax.enabled) return <span className="opacity-70">0%</span>;

    if (tax.distribution.burn === 0) return <span className="text-green-400 whitespace-nowrap">{tax.total}% REWARD</span>;
    if (tax.distribution.burn === 100) return <span className="text-red-400 whitespace-nowrap">{tax.total}% BURN</span>;

    const burnAmount = (tax.total * tax.distribution.burn / 100).toFixed(1);
    const rewardAmount = (tax.total * tax.distribution.reward / 100).toFixed(1);
    return (
      <span className="text-yellow-400 whitespace-nowrap">
        {tax.total}% MIX ({burnAmount}/{rewardAmount})
      </span>
    );
  };

  return (
    <>
      <div className="w-full space-y-4 sm:space-y-8 px-2 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="terminal-card create-token-card p-3 sm:p-4">
            <h2 className="terminal-header mb-3 sm:mb-4">&gt; CREATE_TOKEN</h2>
            <p className="text-sm opacity-70 mb-4">
              Launch your own token with custom tax and distribution settings
            </p>
            <button
              onClick={() => navigate('/create')}
              className="terminal-button w-full py-2 flex items-center justify-center gap-2 group"
            >
              <span>&gt; EXECUTE_PROGRAM</span>
              <ArrowUpRight
                size={16}
                className="text-[#00ff00] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>

          <div className="terminal-card p-3 sm:p-4">
            <h2 className="terminal-header mb-3 sm:mb-4">&gt; ECOSYSTEM_DATA</h2>
            <div className="space-y-2">
              {totalStatsLoading ? (
                <>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_GLITCHES:</span>
                    <div className="w-24 h-6 bg-gray-800 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_REWARDS:</span>
                    <div className="w-24 h-6 bg-gray-800 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_BURNED:</span>
                    <div className="w-24 h-6 bg-gray-800 rounded animate-pulse"></div>
                  </div>
                </>
              ) : totalStats ? (
                <>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_GLITCHES:</span>
                    <span className="terminal-value">{totalStats.total_tokens || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_REWARDS:</span>
                    <span className="terminal-value">{formatCurrency(totalStats.total_distributed || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_BURNED:</span>
                    <span className="terminal-value">{formatCurrency(totalStats.total_burned || 0)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_GLITCHES:</span>
                    <span className="terminal-value opacity-50">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_REWARDS:</span>
                    <span className="terminal-value opacity-50">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; TOTAL_BURNED:</span>
                    <span className="terminal-value opacity-50">N/A</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="terminal-card p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="terminal-header text-xl">&gt; TOP_GLITCH</h2>

            <button
              className="sm:hidden terminal-button w-full flex items-center justify-between px-4 py-2"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            >
              <span>FILTERS</span>
              {isFiltersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded border border-[#00ff00]/20">
              <span className="text-sm opacity-70">VIEWING:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <LineChart size={14} className="text-[#00ff00]" />
                  <span className="text-[#00ff00]">{timeframe.toUpperCase()}</span>
                </div>
                <span className="opacity-30">|</span>
                <div className="flex items-center gap-1">
                  {(() => {
                    const option = sortOptions.find(opt => opt.value === sortBy);
                    const Icon = option?.icon || LineChart;
                    return <Icon size={14} className="text-[#00ff00]" />;
                  })()}
                  <span className="text-[#00ff00]">
                    {sortOptions.find(opt => opt.value === sortBy)?.label}
                  </span>
                </div>
                <span className="opacity-30">|</span>
                <div className="flex items-center gap-1">
                  {(() => {
                    const type = glitchTypes.find(t => t.value === glitchType);
                    const Icon = type?.icon || Sparkles;
                    return <Icon size={14} className={type?.color || 'text-[#00ff00]'} />;
                  })()}
                  <span className={glitchTypes.find(type => type.value === glitchType)?.color}>
                    {glitchType}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 ${isFiltersExpanded ? 'block' : 'hidden sm:grid'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm opacity-70">
                <Sparkles size={14} />
                <span>&gt; FILTER_TYPE</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {glitchTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setGlitchType(type.value as typeof glitchType)}
                      className={`terminal-button px-2 py-1.5 text-xs transition-all duration-200 flex items-center gap-1.5
                        ${glitchType === type.value
                          ? 'bg-[#00ff00]/20 border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                          : 'hover:bg-[#00ff00]/10'}`}
                    >
                      <Icon size={12} className={type.color} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm opacity-70">
                <LineChart size={14} />
                <span>&gt; TIMEFRAME</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {timeframes.map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`terminal-button px-2 py-1.5 text-xs transition-all duration-200
                      ${timeframe === tf.value
                        ? 'bg-[#00ff00]/20 border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                        : 'hover:bg-[#00ff00]/10'}`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm opacity-70">
                <LineChart size={14} />
                <span>&gt; SORT_BY</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sortOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`terminal-button px-2 py-1.5 text-xs transition-all duration-200 flex items-center gap-1.5
                        ${sortBy === option.value
                          ? 'bg-[#00ff00]/20 border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                          : 'hover:bg-[#00ff00]/10'}`}
                    >
                      <Icon size={12} className="text-[#00ff00]" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4">
            <div className="min-w-[800px] px-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="terminal-dim pb-2 text-sm">&gt; TOKEN</th>
                    <th className="terminal-dim pb-2 text-sm">&gt; PRICE</th>
                    <th className={`pb-2 text-sm text-[#00ff00]`}>
                      &gt; 24H
                    </th>
                    <th className={`pb-2 text-sm ${sortBy === 'marketCap' ? 'text-[#00ff00]' : 'terminal-dim'}`}>
                      &gt; MARKET CAP
                    </th>
                    <th className={`pb-2 text-sm ${sortBy === 'volume24h' ? 'text-[#00ff00]' : 'terminal-dim'}`}>
                      &gt; VOLUME
                    </th>
                    <th className={`pb-2 text-sm ${sortBy === 'glitches' ? 'text-[#00ff00]' : 'terminal-dim'}`}>
                      &gt; GLITCHES
                    </th>
                    <th className="pb-2 text-sm text-[#00ff00]">&gt; TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm opacity-70">
                        Loading tokens...
                      </td>
                    </tr>
                  ) : tokens.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm opacity-70">
                        No tokens found
                      </td>
                    </tr>
                  ) : (
                    sortAndFilterTokens(tokens).map(token => (
                      <tr
                        key={token.id}
                        className="border-t border-[#00ff00]/20 cursor-pointer hover:bg-[#00ff00]/10 transition-colors"
                        onClick={() => handleTokenClick(token.id)}
                      >
                        <td className="py-3 text-sm">{token.name}</td>
                        <td className="py-3 text-sm">{formatCurrency(token.price, 8)}</td>
                        <td className="py-3">
                          <div className={`flex items-center gap-1 text-sm ${token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {token.priceChange >= 0 ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            {formatPercentage(token.priceChange)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-sm">
                            <LineChart size={14} className="opacity-50" />
                            {formatCurrency(token.marketCap)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-sm">
                            <LineChart size={14} className="opacity-50" />
                            {formatCurrency(token.volume24h)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-sm">
                            <Sparkles size={14} className="opacity-50" />
                            {formatCurrency(token.glitchesDistributed)}
                          </div>
                        </td>
                        <td className="py-3 text-sm">
                          <div className="flex items-center gap-1">
                            {getActionIcon(token)}
                            <span className={getActionColor(token)}>
                              {getActionLabel(token)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="terminal-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="terminal-header">&gt; GLITCH_VISION</h2>
            <Link
              to="/glitch-vision"
              className="terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-[#00ff00]/10"
            >
              VIEW_ALL
              <ArrowUpRight size={14} className="text-[#00ff00]" />
            </Link>
          </div>
          <div className="flex-grow h-[calc(100vh-280px)] min-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {isLiveFeedLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-[#00ff00] text-lg flex items-center gap-2">
                  <span className="animate-[blink_1s_ease-in-out_infinite]">.</span>
                  <span className="animate-[blink_1s_ease-in-out_0.2s_infinite]">.</span>
                  <span className="animate-[blink_1s_ease-in-out_0.4s_infinite]">.</span>
                  <span className="ml-2">Loading live feed</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {liveFeed.map((item) => (
                  <div
                    key={item.mintAddress}
                    className="flex items-start gap-3 p-3 border-t border-[#00ff00]/20 first:border-t-0 hover:bg-[#00ff00]/5 transition-colors cursor-pointer bg-black/30"
                    onClick={() => navigate(`/token/${item.mintAddress}`)}
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-[#00ff00]/30">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Zap size={14} className="text-[#00ff00] flex-shrink-0" />
                        <span className="font-semibold truncate">{item.name}</span>
                        <span className="text-xs opacity-70">({item.symbol})</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden">
                        <Timer size={14} className="text-[#00ff00] flex-shrink-0" />
                        <span className="opacity-70">Tax:</span>
                        {getTaxDistributionLabel({ enabled: item.taxRate != 0, total: item.taxRate, distribution: { burn: item.burnRate, reward: item.distributionRate } })}
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-xs">
                      <RelativeTime timestamp={item.timestamp} />
                      <span className="font-mono">{item.mintAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 mb-4">
          <div className="terminal-card p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2">
                <a
                  href="https://twitter.com/moneyglitchfun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Twitter size={14} className="text-[#00ff00]" />
                  FOLLOW
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  SUPPORT
                  <ArrowUpRight size={14} className="text-[#00ff00]" />
                </a>
                <Link
                  to="/how-it-works"
                  className="terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  HOW_IT_WORKS
                  <ArrowUpRight size={14} className="text-[#00ff00]" />
                </Link>
              </div>

              <div className="text-center text-xs opacity-70">&gt; POWERED_BY_MONEYGLITCH.FUN</div>
            </div>
          </div>
          <div className='h-4' />
        </footer>
      </div>
    </>
  );
}

export default HomePage;