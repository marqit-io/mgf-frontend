import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LineChart, Zap, Terminal, Cpu, Gift, Code, Eye, Key, RefreshCw, Book, Sparkles } from 'lucide-react';

interface LeagueInfo {
  name: string;
  color: string;
  icon: typeof Key;
  description: string;
  requirement: {
    points: number;
  };
}

function PointsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const leagues: Record<string, LeagueInfo> = {
    'ARCHITECT': {
      name: 'ARCHITECT',
      color: 'text-red-400',
      icon: Key,
      description: 'System architects with the power to reshape the Matrix',
      requirement: {
        points: 100000
      }
    },
    'ORACLE': {
      name: 'ORACLE',
      color: 'text-purple-400',
      icon: Eye,
      description: 'Visionaries who can see through the code of reality',
      requirement: {
        points: 50000
      }
    },
    'MORPHEUS': {
      name: 'MORPHEUS',
      color: 'text-blue-400',
      icon: Code,
      description: 'Leaders who guide others through the digital realm',
      requirement: {
        points: 10000
      }
    },
    'NEO': {
      name: 'NEO',
      color: 'text-green-400',
      icon: Zap,
      description: 'The ones beginning to believe in their potential',
      requirement: {
        points: 0
      }
    }
  };

  const volume24h = 64219.31;
  const points = Math.floor(volume24h / 100);

  const getUserLeague = (points: number): keyof typeof leagues => {
    if (points >= 100000) return 'ARCHITECT';
    if (points >= 50000) return 'ORACLE';
    if (points >= 10000) return 'MORPHEUS';
    return 'NEO';
  };

  const userStats = {
    totalPoints: points,
    rank: 4926,
    league: getUserLeague(points),
    volume24h: volume24h
  };

  const currentLeague = leagues[userStats.league];
  const LeagueIcon = currentLeague.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="terminal-button px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>&gt; RETURN_HOME</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8">
          <div className="terminal-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Terminal size={24} className="text-[#00ff00]" />
                <h1 className="terminal-header text-2xl">SYSTEM_ACCESS_LEVEL</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs opacity-70">
                  Last update: {formatTime(lastUpdated)}
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`terminal-button p-2 ${isRefreshing ? 'animate-pulse' : 'hover:bg-[#00ff00]/10'}`}
                >
                  <RefreshCw
                    size={16}
                    className={`text-[#00ff00] ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-lg p-4 text-sm leading-relaxed mb-6">
              <div className="flex items-start gap-3">
                <Gift size={20} className="text-[#00ff00] mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="opacity-90">
                    Your trading volume generates points in real-time. Every $100 in volume equals 1 point in the system.
                  </p>
                  <p className="opacity-90">
                    Points determine your system access level and future airdrop allocation. The more you trade, the higher your rank climbs.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="terminal-card bg-black/30 p-4">
                <div className="text-sm opacity-70">System Points</div>
                <div className="text-4xl font-bold text-[#00ff00]">{userStats.totalPoints}</div>
                <div className="text-xs opacity-70 mt-1">$100 = 1 point</div>
              </div>

              <div className="terminal-card bg-black/30 p-4">
                <div className="text-sm opacity-70">Access Level</div>
                <div className="text-4xl font-bold">{userStats.rank}</div>
                <div className="text-xs opacity-70 mt-1">Global rank</div>
              </div>

              <div className="terminal-card bg-black/30 p-4">
                <div className="text-sm opacity-70">24h Volume</div>
                <div className="text-2xl font-bold font-mono">{formatCurrency(userStats.volume24h)}</div>
                <div className="text-xs opacity-70 mt-1">Trading activity</div>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(leagues).map(([key, league]) => {
                const Icon = league.icon;
                const isCurrentLeague = key === userStats.league;
                const nextLeague = leagues[Object.keys(leagues)[Object.keys(leagues).indexOf(key) - 1]];
                const pointsNeeded = nextLeague ? nextLeague.requirement.points - userStats.totalPoints : 0;

                return (
                  <div
                    key={key}
                    className={`terminal-card bg-black/30 p-4 ${isCurrentLeague ? 'border-2' : 'border'} ${isCurrentLeague ? league.color : 'border-[#00ff00]/20'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Icon size={24} className={league.color} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className={`font-bold truncate ${league.color}`}>{league.name}</div>
                          {isCurrentLeague && (
                            <div className="flex-shrink-0 px-2 py-1 bg-[#00ff00]/10 rounded text-xs border border-[#00ff00]/20">
                              CURRENT
                            </div>
                          )}
                        </div>
                        <div className="text-xs opacity-70 mt-1 line-clamp-2">{league.description}</div>
                        <div className="text-xs mt-2">
                          {key === 'NEO' ? (
                            <span className="text-[#00ff00]/70">0 - 10K points</span>
                          ) : (
                            <span className="text-[#00ff00]/70">{formatNumber(league.requirement.points)}+ points</span>
                          )}
                          {isCurrentLeague && nextLeague && (
                            <div className="mt-1 text-xs opacity-70">
                              {formatNumber(pointsNeeded)} more points to {nextLeague.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="terminal-card p-6 bg-gradient-to-br from-[#001a00] to-black">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 flex items-center justify-center">
                <Cpu size={48} className="text-[#00ff00]" />
              </div>

              <div>
                <div className="text-sm opacity-70">System Points</div>
                <div className="text-5xl font-bold text-[#00ff00] mt-2">{userStats.totalPoints}</div>
                <div className="text-xs opacity-70 mt-2">$100 volume = 1 point</div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-lg border border-[#00ff00]/20">
                <LeagueIcon size={16} className={currentLeague.color} />
                <span className={currentLeague.color}>{currentLeague.name}</span>
                <span className="opacity-50">|</span>
                <span>#{userStats.rank}</span>
              </div>
            </div>
          </div>

          <div className="terminal-card p-4">
            <div className="text-sm">
              <p className="mb-4 opacity-70">Points calculation:</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-black/30 rounded border border-[#00ff00]/20">
                  <LineChart size={16} className="text-[#00ff00]" />
                  <span>Every $100 traded = 1 point</span>
                </div>
              </div>
            </div>
          </div>

          <div className="terminal-card p-4">
            <div className="text-sm space-y-3">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-[#00ff00]" />
                <h3 className="font-bold">SYSTEM_DIRECTIVE</h3>
              </div>
              <p className="opacity-70">
                Points are calculated in real-time based on your trading volume. Every $100 in volume contributes 1 point to your total.
              </p>
              <p className="opacity-70">
                Points determine your position in Airdrop and other rewards.
              </p>
              <a
                href="https://docs.moneyglitch.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="terminal-button w-full py-2 mt-2 flex items-center justify-center gap-2"
              >
                <Book size={14} className="text-[#00ff00]" />
                <span>READ_DOCS</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="terminal-card p-6 bg-gradient-to-br from-[#001a00] to-black border border-[#00ff00]/30">
        <div className="flex items-start gap-3">
          <Sparkles size={24} className="text-[#00ff00] mt-1 flex-shrink-0 animate-pulse" />
          <div>
            <h3 className="text-[#00ff00] font-bold text-lg mb-3">&gt; SYSTEM_EXPANSION</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              The Matrix is evolving. Enhanced system privileges and new point accumulation vectors are being integrated for each access level. Prepare for expanded capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PointsPage;