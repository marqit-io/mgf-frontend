import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal, Zap, Timer, Gift, Flame, Sparkles, ArrowRight, ArrowUpDown, Waves, Wallet, ArrowUpRight } from 'lucide-react';

function HowItWorksPage() {
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
          <Terminal size={24} className="text-[#00ff00]" />
          <h1 className="terminal-header text-2xl">&gt; SYSTEM_MANUAL</h1>
        </div>

        <div className="space-y-8 font-mono">
          {/* New Introduction Banner */}
          <div className="bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-lg p-4 text-sm leading-relaxed">
            <div className="flex items-start gap-3">
              <Waves size={20} className="text-[#00ff00] mt-1 flex-shrink-0" />
              <div className="space-y-3">
                <p className="opacity-90">
                  <span className="text-[#00ff00] font-bold">Bonding Curves are old tech...</span>
                </p>
                <p className="opacity-90">
                  With concentrated liquidity market maker, your token launches instantly on Raydium with a juicy $5K initial market cap. No more waiting around for migrations or complicated setups - it's trading time from day one!
                </p>
                <p className="opacity-90">
                  At <span className="text-[#00ff00] font-bold">MONEYGLITCH.FUN</span> - we want you to let your imagination run wild.
                </p>
                <p className="opacity-90">
                  We're not a boring launchpad - we're your playground for crafting unique, rewarding experiences that keep communities coming back for more.
                </p>
                <p className="opacity-90">
                  Forget the limitations, let your mind run wild, <span className="font-bold text-[#00ff00]">create your token today for free</span>!
                </p>
                <div className="pt-2">
                  <Link
                    to="/create"
                    className="terminal-button px-4 py-2 text-sm inline-flex items-center gap-2 group"
                  >
                    <span>&gt; CREATE_TOKEN</span>
                    <ArrowRight size={14} className="text-[#00ff00] transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#00ff00]">
              <Zap size={18} />
              <h2 className="text-lg">&gt; INTRODUCTION</h2>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <p className="opacity-80">
                MONEYGLITCH.FUN is a revolutionary protocol that introduces automated reward distribution through the concept of "glitches" in the matrix.
              </p>
              <p className="opacity-80">
                Each token implements a tax on transactions (buys, sells, transfers) which accumulates in a pool, and is then distributed at specified intervals.
              </p>
            </div>
          </div>

          {/* Transaction Tax */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#00ff00]">
              <ArrowUpDown size={18} />
              <h2 className="text-lg">&gt; TRANSACTION_TAX</h2>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <p className="opacity-80">
                Every transaction is subject to a configurable tax rate:
              </p>
              <ul className="list-disc pl-6 space-y-2 opacity-80">
                <li>Buy transactions</li>
                <li>Sell transactions</li>
                <li>Transfer transactions</li>
              </ul>
              <p className="opacity-80 mt-2">
                These taxes are collected and held in a pool until the next distribution interval.
              </p>
            </div>
          </div>

          {/* Distribution Types */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#00ff00]">
              <Timer size={18} />
              <h2 className="text-lg">&gt; DISTRIBUTION_TYPES</h2>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <p className="opacity-80">
                At each interval, the accumulated tax pool is distributed according to one of three mechanisms:
              </p>
              <div className="space-y-3 mt-4">
                <div className="flex items-start gap-2">
                  <Gift size={16} className="text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-green-400">REWARD</p>
                    <p className="opacity-80">100% of accumulated taxes are distributed to token holders in the form of your chosen token (e.g. SOL, POWSCHE)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Flame size={16} className="text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-red-400">BURN</p>
                    <p className="opacity-80">100% of accumulated taxes are permanently removed from circulation</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-400">MIX</p>
                    <p className="opacity-80">Custom ratio between burn and reward distribution (e.g., 60% burn / 40% reward in your chosen token)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Token */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#00ff00]">
              <Wallet size={18} />
              <h2 className="text-lg">&gt; DISTRIBUTION_TOKEN</h2>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <p className="opacity-80">
                When configuring reward distributions, you can select which token to distribute to holders:
              </p>
              <ul className="list-disc pl-6 space-y-2 opacity-80">
                <li>Native tokens like SOL</li>
                <li>Stablecoins</li>
                <li>Any SPL token (e.g. POWSCHE)</li>
              </ul>
              <p className="opacity-80 mt-2">
                The selected token will be automatically distributed to holders at each interval based on their holdings percentage.
              </p>
              <div className="bg-black/30 p-4 rounded border border-[#00ff00]/20 mt-4">
                <p className="text-xs opacity-70">Example:</p>
                <p className="mt-2">
                  If you configure a 5% tax with REWARD distribution in SOL, and your token has $1,000,000 in trading volume:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 opacity-80">
                  <li>$50,000 worth of SOL is collected (5% tax)</li>
                  <li>At the next interval, the SOL is distributed to holders</li>
                  <li>A holder with 10% of the supply receives $5,000 worth of SOL</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Distribution Intervals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#00ff00]">
              <Timer size={18} />
              <h2 className="text-lg">&gt; DISTRIBUTION_INTERVALS</h2>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <p className="opacity-80">
                The accumulated tax pool is distributed at predetermined intervals:
              </p>
              <pre className="bg-black/30 p-4 rounded border border-[#00ff00]/20 mt-2">
                {`DISTRIBUTION_INTERVALS = [
  "5_MINUTES",
  "15_MINUTES",
  "30_MINUTES",
  "1_HOUR",
  "2_HOURS",
  "4_HOURS",
  "6_HOURS",
  "12_HOURS",
  "24_HOURS"
]`}
              </pre>
              <p className="opacity-80 mt-4">
                At each interval, a "glitch" occurs that processes the entire accumulated tax pool according to the token's distribution configuration set by the tokens creator.
              </p>
            </div>
          </div>

          {/* Getting Started */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#00ff00]">
              <Zap size={18} />
              <h2 className="text-lg">&gt; GETTING_STARTED</h2>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <p className="opacity-80">
                To create your own token:
              </p>
              <ol className="list-decimal pl-6 space-y-2 opacity-80">
                <li>Click the CREATE_TOKEN button on the homepage</li>
                <li>Set your transaction tax rate</li>
                <li>Choose your distribution mechanism (REWARD, BURN, or MIX)</li>
                <li>Select your preferred distribution interval</li>
                <li>Deploy your token to the network</li>
              </ol>
            </div>
          </div>

          {/* New Enhanced CTA Section */}
          <div className="mt-12 create-token-card p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-[#00ff00]">&gt; READY_TO_CREATE?</h3>
            <p className="text-lg mb-6 opacity-80">
              Launch your token now and explore endless possibilities
            </p>
            <div className="flex justify-center">
              <Link
                to="/create"
                className="terminal-button px-8 py-4 text-lg inline-flex items-center gap-3 group hover:scale-105 transition-all duration-300 relative overflow-hidden"
              >
                <span className="relative z-10">&gt; CREATE_TOKEN</span>
                <ArrowUpRight
                  size={20}
                  className="text-[#00ff00] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 relative z-10"
                />
                <div className="absolute inset-0 bg-[#00ff00]/10 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default HowItWorksPage;