import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Timer, Gift, Flame, Sparkles, ArrowUpRight, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { LiveFeedItem } from '../types/token';
import { getTotalStats } from '../utils/getData';

function GlitchVisionPage() {
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'BURN' | 'REWARD' | 'MIX'>('ALL');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [totalStats, setTotalStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const filterTypes = [
    { value: 'ALL', label: 'ALL', icon: Sparkles, color: 'text-[#00ff00]' },
    { value: 'BURN', label: 'BURN', icon: Flame, color: 'text-red-400' },
    { value: 'REWARD', label: 'REWARD', icon: Gift, color: 'text-green-400' },
    { value: 'MIX', label: 'MIX', icon: Sparkles, color: 'text-yellow-400' }
  ] as const;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  useEffect(() => {
    const mockImages = [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=64&h=64',
      'https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&q=80&w=64&h=64',
      'https://images.unsplash.com/photo-1639762681297-b1d4401b7fcd?auto=format&fit=crop&q=80&w=64&h=64',
    ];

    const generateLiveFeedItem = (): LiveFeedItem => {
      const hasTax = Math.random() > 0.3;
      const totalTax = hasTax ? Math.floor(Math.random() * 15) + 1 : 0;

      const distributionType = Math.random();
      let burnRatio;

      if (distributionType < 0.33) {
        burnRatio = 100;
      } else if (distributionType < 0.66) {
        burnRatio = 0;
      } else {
        burnRatio = Math.floor(Math.random() * 80) + 10;
      }

      return {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        name: `Token${Math.floor(Math.random() * 1000)}`,
        symbol: `TKN${Math.floor(Math.random() * 100)}`,
        image: mockImages[Math.floor(Math.random() * mockImages.length)],
        creator: `${Math.random().toString(36).substring(7)}...${Math.random().toString(36).substring(4)}`,
        tax: {
          enabled: hasTax,
          total: totalTax,
          distribution: {
            burn: burnRatio,
            reward: 100 - burnRatio,
          },
        },
      };
    };

    const generateInitialFeed = () => {
      const items: LiveFeedItem[] = [];

      const types = [
        { burn: 100, reward: 0 },
        { burn: 0, reward: 100 },
        { burn: 60, reward: 40 },
      ];

      types.forEach(distribution => {
        items.push({
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          name: `Token${Math.floor(Math.random() * 1000)}`,
          symbol: `TKN${Math.floor(Math.random() * 100)}`,
          image: mockImages[Math.floor(Math.random() * mockImages.length)],
          creator: `${Math.random().toString(36).substring(7)}...${Math.random().toString(36).substring(4)}`,
          tax: {
            enabled: true,
            total: Math.floor(Math.random() * 15) + 1,
            distribution: {
              burn: distribution.burn,
              reward: distribution.reward,
            },
          },
        });
      });

      while (items.length < 50) {
        items.push(generateLiveFeedItem());
      }

      return items;
    };

    const initialItems = generateInitialFeed();
    setLiveFeed(initialItems);

    const interval = setInterval(() => {
      setLiveFeed(prev => {
        const newItem = generateLiveFeedItem();
        return [newItem, ...prev].slice(0, 100);
      });
    }, 3000);

    return () => clearInterval(interval);
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
        setStatsLoading(false);
      }
    };

    fetchTotalStats();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
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

  const filteredFeed = filter === 'ALL'
    ? liveFeed
    : liveFeed.filter(item => {
      if (!item.tax?.enabled) return false;
      switch (filter) {
        case 'BURN': return item.tax.distribution.burn === 100;
        case 'REWARD': return item.tax.distribution.burn === 0;
        case 'MIX': return item.tax.distribution.burn > 0 && item.tax.distribution.burn < 100;
        default: return true;
      }
    });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        {/* Left Column - Stats */}
        <div className="lg:col-span-3 space-y-4">
          <div className="terminal-card p-4">
            <Link
              to="/"
              className="terminal-button w-full py-2 text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>&gt; RETURN_HOME</span>
            </Link>
          </div>

          <div className="terminal-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-[#00ff00]" />
              <h2 className="terminal-header text-lg">&gt; GLITCH_STATS</h2>
            </div>

            <div className="space-y-3">
              {statsLoading ? (
                <>
                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-red-400" />
                      <div>
                        <div className="text-xs opacity-70">Total Burned</div>
                        <div className="w-24 h-5 bg-gray-800 rounded animate-pulse mt-1"></div>
                      </div>
                    </div>
                  </div>

                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-green-400" />
                      <div>
                        <div className="text-xs opacity-70">Total Rewards</div>
                        <div className="w-24 h-5 bg-gray-800 rounded animate-pulse mt-1"></div>
                      </div>
                    </div>
                  </div>

                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="text-[#00ff00]" />
                      <div>
                        <div className="text-xs opacity-70">Total Tokens</div>
                        <div className="w-24 h-5 bg-gray-800 rounded animate-pulse mt-1"></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : totalStats ? (
                <>
                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-red-400" />
                      <div>
                        <div className="text-xs opacity-70">Total Burned</div>
                        <div className="text-sm">{formatCurrency(totalStats.total_burned || 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-green-400" />
                      <div>
                        <div className="text-xs opacity-70">Total Rewards</div>
                        <div className="text-sm">{formatCurrency(totalStats.total_distributed || 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="text-[#00ff00]" />
                      <div>
                        <div className="text-xs opacity-70">Total Tokens</div>
                        <div className="text-sm">{totalStats.total_tokens || 0}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-red-400" />
                      <div>
                        <div className="text-xs opacity-70">Total Burned</div>
                        <div className="text-sm opacity-50">N/A</div>
                      </div>
                    </div>
                  </div>

                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-green-400" />
                      <div>
                        <div className="text-xs opacity-70">Total Rewards</div>
                        <div className="text-sm opacity-50">N/A</div>
                      </div>
                    </div>
                  </div>

                  <div className="terminal-card bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="text-[#00ff00]" />
                      <div>
                        <div className="text-xs opacity-70">Total Tokens</div>
                        <div className="text-sm opacity-50">N/A</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="terminal-card create-token-card p-4">
            <div className="space-y-2">
              <h3 className="terminal-header text-sm">&gt; CREATE_YOUR_TOKEN</h3>
              <p className="text-xs opacity-70 mb-3">
                Launch your own token with custom tax and distribution settings
              </p>
              <Link
                to="/create"
                className="terminal-button w-full py-2.5 flex items-center justify-center gap-2 group"
              >
                <span>&gt; START_NOW</span>
                <ArrowUpRight
                  size={16}
                  className="text-[#00ff00] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Live Feed */}
        <div className="lg:col-span-9 terminal-card p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap size={24} className="text-[#00ff00]" />
                <h1 className="terminal-header text-2xl">&gt; LIVE_FEED</h1>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                className="lg:hidden terminal-button px-4 py-2 flex items-center gap-2"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              >
                <Filter size={16} />
                {isFiltersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-2">
                {filterTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setFilter(type.value)}
                      className={`terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5
                        ${filter === type.value ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''}`}
                    >
                      <Icon size={14} className={type.color} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Filters */}
            {isFiltersExpanded && (
              <div className="lg:hidden flex flex-wrap gap-2 mb-4">
                {filterTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setFilter(type.value)}
                      className={`terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5
                        ${filter === type.value ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''}`}
                    >
                      <Icon size={14} className={type.color} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Live Feed */}
            <div className="flex-grow h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                {filteredFeed.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border-t border-[#00ff00]/20 first:border-t-0 hover:bg-[#00ff00]/5 transition-colors cursor-pointer bg-black/30 rounded"
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-[#00ff00]/30">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                        {getTaxDistributionLabel(item.tax || { enabled: false, total: 0, distribution: { burn: 0, reward: 0 } })}
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-xs">
                      <span className="opacity-70 whitespace-nowrap">{formatTime(item.timestamp)}</span>
                      <span className="font-mono">{item.creator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlitchVisionPage;