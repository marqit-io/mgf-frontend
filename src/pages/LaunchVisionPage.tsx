import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Timer, Gift, Flame, Sparkles, ArrowUpRight } from 'lucide-react';
import type { LiveFeedItem } from '../types/token';

function LaunchVisionPage() {
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);

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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTaxDistributionColor = (burnRatio: number) => {
    if (burnRatio === 0) return 'text-green-400';
    if (burnRatio === 100) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getTaxDistributionIcon = (burnRatio: number) => {
    if (burnRatio === 0) return <Gift size={16} className="text-green-400" />;
    if (burnRatio === 100) return <Flame size={16} className="text-red-400" />;
    return <Sparkles size={16} className="text-yellow-400" />;
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="terminal-button px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>&gt; RETURN_HOME</span>
        </Link>
      </div>

      <div className="terminal-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap size={24} className="text-[#00ff00]" />
          <h1 className="terminal-header text-2xl">&gt; LAUNCH_VISION</h1>
        </div>

        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="terminal-card bg-black/30 p-4">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-red-400" />
                <div>
                  <div className="text-sm opacity-70">Total Burned</div>
                  <div className="text-lg">$494,625.00</div>
                </div>
              </div>
            </div>
            <div className="terminal-card bg-black/30 p-4">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-green-400" />
                <div>
                  <div className="text-sm opacity-70">Total Rewards</div>
                  <div className="text-lg">$989,250.00</div>
                </div>
              </div>
            </div>
            <div className="terminal-card bg-black/30 p-4">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-[#00ff00]" />
                <div>
                  <div className="text-sm opacity-70">Avg. Interval</div>
                  <div className="text-lg">5.2 Hours</div>
                </div>
              </div>
            </div>
            <div className="terminal-card bg-black/30 p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#00ff00]" />
                <div>
                  <div className="text-sm opacity-70">Active Glitches</div>
                  <div className="text-lg">1,247</div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Feed */}
          <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2">
              {liveFeed.map((item) => (
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

          {/* Create Token CTA */}
          <div className="flex justify-center pt-4">
            <Link
              to="/create"
              className="terminal-button px-6 py-3 flex items-center gap-2 group"
            >
              <span>&gt; CREATE_YOUR_TOKEN</span>
              <ArrowUpRight 
                size={18} 
                className="text-[#00ff00] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" 
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaunchVisionPage;