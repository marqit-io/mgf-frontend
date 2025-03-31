import { useState } from 'react';
import { Calculator, Timer, Gift, ArrowRight } from 'lucide-react';

interface RewardsCalculatorProps {
  distributionFee: number;  // Distribution fee percentage
  volume24h: number;        // 24h volume in USD
  totalSupply: number;      // Total token supply
  userTokenBalance: number; // User's token balance
  userTokenSymbol: string;  // Symbol of user's token
  distributionTokenSymbol: string;  // Symbol of distribution token
}

interface TimeframeOption {
  value: number;
  label: string;
}

export function RewardsCalculator({
  distributionFee,
  volume24h,
  totalSupply,
  userTokenBalance,
  userTokenSymbol,
  distributionTokenSymbol,
}: RewardsCalculatorProps) {
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>({
    value: 1,
    label: '1 HOUR'
  });
  const [projectedVolume, setProjectedVolume] = useState<'current' | 'custom'>('current');
  const [customVolume, setCustomVolume] = useState<string>('');

  const timeframeOptions: TimeframeOption[] = [
    { value: 1, label: '1 HOUR' },
    { value: 24, label: '1 DAY' },
    { value: 168, label: '1 WEEK' },
    { value: 720, label: '1 MONTH' },
    { value: 8760, label: '1 YEAR' }
  ];

  const calculateRewards = () => {
    if (!tokenAmount) return { usdInDay: 0, usdInTimeFrame: 0 };

    debugger;

    const volume = projectedVolume === 'current' ? volume24h : parseFloat(customVolume || '0');
    const timeMultiplier = selectedTimeframe.value / 24; // Convert hours to days
    const userShare = parseFloat(tokenAmount) / totalSupply;

    const totalTaxCollected = volume * distributionFee * timeMultiplier;
    console.log(totalSupply);
    const userRewards = totalTaxCollected * userShare;

    return {
      usdInDay: volume * distributionFee * userShare,
      usdInTimeFrame: userRewards
    };
  };

  const rewards = calculateRewards();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleSetMaxAmount = () => {
    if (userTokenBalance > 0) {
      setTokenAmount(totalSupply.toString());
    }
  };

  const handleSetCurrentAmount = () => {
    setTokenAmount(userTokenBalance.toString());
  };

  return (
    <div className="terminal-card p-4 sm:p-6 relative">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Calculator size={20} className="text-[#00ff00]" />
          <h2 className="terminal-header">&gt; REWARDS_CALCULATOR</h2>
        </div>

        <div className="space-y-6">
          {/* Token Amount Input */}
          <div>
            <label className="block text-sm mb-2">
              &gt; YOUR_HOLDINGS (Current Balance: ${userTokenSymbol} {userTokenBalance})
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="Enter amount of tokens"
                  className="terminal-input w-full px-3 py-2"
                />
              </div>
              {userTokenBalance > 0 && (
                <button
                  onClick={handleSetCurrentAmount}
                  className="terminal-button px-3 py-2 hover:bg-[#00ff00]/10"
                >
                  CURRENT
                </button>
              )}
              <button
                onClick={handleSetMaxAmount}
                className="terminal-button px-3 py-2 hover:bg-[#00ff00]/10"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Timeframe Buttons */}
          <div>
            <label className="block text-sm mb-2">
              &gt; TIMEFRAME
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {timeframeOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setSelectedTimeframe(option)}
                  className={`px-3 py-2 text-xs transition-all duration-200 border ${selectedTimeframe.label === option.label
                    ? 'bg-[#00ff00]/20 border-[#00ff00] text-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                    : 'terminal-button hover:bg-[#00ff00]/10'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Projection */}
          <div>
            <label className="block text-sm mb-2">
              &gt; VOLUME_PROJECTION
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="currentVolume"
                  checked={projectedVolume === 'current'}
                  onChange={() => setProjectedVolume('current')}
                  className="terminal-checkbox"
                />
                <label htmlFor="currentVolume" className="text-sm">
                  Current (${volume24h}/day)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="customVolume"
                  checked={projectedVolume === 'custom'}
                  onChange={() => setProjectedVolume('custom')}
                  className="terminal-checkbox"
                />
                <label htmlFor="customVolume" className="text-sm">
                  Custom
                </label>
              </div>
              {projectedVolume === 'custom' && (
                <input
                  type="number"
                  value={customVolume}
                  onChange={(e) => setCustomVolume(e.target.value)}
                  className="terminal-input w-full px-3 py-2"
                  placeholder="Enter daily volume in USD"
                />
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-black/30 p-4 rounded border border-[#00ff00]/20 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Timer size={16} className="text-[#00ff00]" />
                <span>Timeframe:</span>
              </div>
              <span className="font-mono">
                {selectedTimeframe.label}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-green-400" />
                <span>Estimated Rewards:</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-[#00ff00]">
                  ≈ {formatCurrency(rewards.usdInTimeFrame)} of {distributionTokenSymbol}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#00ff00]/20">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <ArrowRight size={12} className="text-[#00ff00]" />
                <span>
                  {formatCurrency(rewards.usdInDay)} of {distributionTokenSymbol} per day
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 255, 0, 0.2) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent 0px, transparent 10px, rgba(0, 255, 0, 0.1) 10px, rgba(0, 255, 0, 0.1) 20px)'
        }}
      />
    </div>
  );
}