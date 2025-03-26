import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp as TrendUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight, Copy, Check, Globe, ExternalLink, Share } from 'lucide-react';
import { PriceChartWidget } from '../components/PriceChart';
import { TradePanel } from '../components/TradePanel';
import { PublicKey } from '@solana/web3.js';
import { getTokenDataFromMintAddress, getTokenTopHolders, getTokenBalance, getSolBalance } from '../utils/getData';
import { subscribeToTokenTrades, fetchRecentTrades, getTokenPrice } from '../utils/trades';
import { PnlCalculatorModal } from '../components/PnlCalculatorModal';
import { RewardsCalculator } from '../components/RewardsCalculator';
import { useWallet } from '@solana/wallet-adapter-react';
import { XLogo } from '../components/XLogo';
import { TelegramLogo } from '../components/TelegramLogo';
import { TokenStatsOverview } from '../components/TokenStatsOverview';

interface Transaction {
  id: string;
  timestamp: string;
  type: 'BUY' | 'SELL';
  amountUsd: number;
  amountSol: number;
  txHash: string;
}

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

const TRANSACTION_LIST_SIZE = 10;

// Add this component for skeleton loading
const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-white/10 rounded ${className}`}></div>
);

const formatPrice = (price: number) => {
  if (price < 0.000001) {
    return `$${price.toExponential(6)}`; // Shows scientific notation for very small numbers
  } else if (price < 0.01) {
    return `$${price.toFixed(6)}`; // Shows up to 6 decimal places for small numbers
  }
  return `$${price.toFixed(2)}`; // Original format for regular numbers
}

// Add this new component at the top of the file
const LoadingScreen = () => (
  <div className="w-full min-h-screen p-2 sm:p-4 flex items-center justify-center">
    <div className="terminal-card p-8 w-full max-w-md">
      <div className="space-y-4">
        {/* Loading message */}
        <div className="text-[#00ff00] text-lg text-center mb-4">
          Fetching token data...
        </div>

        {/* Progress bar container */}
        <div className="w-full h-2 bg-[#00ff00]/20 rounded-full overflow-hidden">
          {/* Animated progress bar */}
          <div
            className="h-full bg-[#00ff00] rounded-full animate-loading-progress"
            style={{
              width: '100%',
              animation: 'loading 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Loading dots */}
        <div className="text-center text-[#00ff00]/50">
          <span className="animate-[blink_1s_ease-in-out_infinite]">.</span>
          <span className="animate-[blink_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="animate-[blink_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    </div>
  </div>
);

// Add this new component near the top of the file
const ErrorScreen = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="w-full min-h-screen p-2 sm:p-4 flex items-center justify-center">
    <div className="terminal-card p-8 w-full max-w-md">
      <div className="space-y-6 text-center">
        <div className="text-red-400 text-lg mb-4">
          {message}
        </div>
        <button
          onClick={onRetry}
          className="terminal-button px-6 py-3 hover:bg-[#00ff00]/10 flex items-center gap-2 mx-auto"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  </div>
);

export default function TokenProfilePage() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { publicKey, connected } = useWallet();
  const [tokenAddress, setTokenAddress] = useState<PublicKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'holders'>('transactions');
  const [tokenData, setTokenData] = useState<any>(location.state?.initialTokenData || null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [price, setPrice] = useState<number>(0);
  const [priceInSol, setPriceInSol] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPnlModalOpen, setIsPnlModalOpen] = useState(false);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(tokenData.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const getSolscanUrl = (address: string) => {
    return `https://solscan.io/account/${address}`;
  };

  const getSolscanTokenUrl = (address: string) => {
    return `https://solscan.io/token/${address}`;
  };

  const getSolscanTokenHoldersUrl = (address: string) => {
    return `https://solscan.io/token/${address}#holders`;
  };

  const updatePrice = async () => {
    if (tokenAddress) {
      try {
        const { price, priceInSol } = await getTokenPrice(tokenAddress.toString());
        if (price == 0) return;
        setPrice(price);
        setPriceInSol(priceInSol);
      } catch (error) {
        console.error('Error fetching token price:', error);
      }
    }
  };

  const updateBalances = async () => {
    console.log('Updating balances ....');
    if (connected && publicKey && tokenAddress) {
      getTokenBalance(publicKey, tokenAddress).then(balance => {
        setTokenBalance(balance);
        console.log("Token Balance :", balance);
      });
      getSolBalance(publicKey).then(balance => {
        setSolBalance(balance);
        console.log("Sol Balance :", balance);
      });
    }
  };

  useEffect(() => {
    updateBalances();
  }, [connected, publicKey, tokenAddress]);

  useEffect(() => {
    if (!tokenId) {
      setError('No token address provided');
      return;
    }

    try {
      const pubkey = new PublicKey(tokenId);
      setTokenAddress(pubkey);
      setError(null);
    } catch (err) {
      console.error('Invalid token address:', err);
      setError('Invalid token address');
      navigate('/'); // Redirect to home page on invalid address
    }
  }, [tokenId, navigate]);

  const fetchTokenData = async () => {
    if (!tokenAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTokenDataFromMintAddress(tokenAddress);
      if (!data) {
        throw new Error('TOKEN_NOT_FOUND');
      }
      setTokenData(data);
      setPrice(data.price);

      fetchRecentTrades(tokenAddress.toString(), data.poolAddress.toString()).then(trades => {
        setTransactions(trades);
      });

      const holdersData = await getTokenTopHolders(tokenAddress, data.totalSupply, data.price);
      if (holdersData) {
        setHolders(holdersData);
      }
    } catch (error: any) {
      console.error('Error fetching token data:', error);
      // Set appropriate error message based on the error
      if (error.message === 'TOKEN_NOT_FOUND') {
        setError('Token not found. Please check the token address.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Connection failed. Please check your internet connection.');
      } else {
        setError('Failed to load token data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokenAddress) {
      fetchTokenData();
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (tokenAddress) {
      const unsubscribe = subscribeToTokenTrades(
        tokenAddress.toString(),
        (trade) => {
          setTransactions(prev => [
            trade,
            ...prev.slice(0, TRANSACTION_LIST_SIZE - 1)
          ]);
        }
      );
      return () => {
        unsubscribe();
      };
    }
  }, [tokenAddress]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Initial price fetch
    updatePrice();

    // Set up interval for price updates
    intervalId = setInterval(updatePrice, 30000); // 30 seconds

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [tokenAddress]);

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

  const formatSolAmount = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return '--';
    return `${amount.toFixed(2)} SOL`;
  };

  const formatTxHash = (hash: string | null | undefined) => {
    if (!hash) return <code className="font-mono">--</code>;
    return (
      <a
        href={`https://solscan.io/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono flex items-center gap-1 hover:text-[#00ff00] transition-colors"
      >
        {hash.slice(0, 4)}...{hash.slice(-4)}
        <ExternalLink size={12} className="opacity-50" />
      </a>
    );
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(2)}K`;
    }
    return new Intl.NumberFormat('en-US').format(balance);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={fetchTokenData} />;
  }

  if (!tokenData) {
    return (
      <div className="w-full min-h-screen p-2 sm:p-4 flex items-center justify-center">
        <div className="terminal-card p-8">
          <div className="text-red-400 text-lg">No token data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-2 sm:p-4">
      {/* Header Section */}
      <div className="terminal-card p-3 sm:p-4 mb-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Token Info Header */}
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Profile Image */}
            <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-[#00ff00] shadow-[0_0_15px_rgba(0,255,0,0.3)]">
              {tokenData ? (
                <img
                  src={tokenData.profileImage}
                  alt={`${tokenData.name} token`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* Token Info */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                  {tokenData ? (
                    <>
                      <h1 className="terminal-header text-base sm:text-lg md:text-2xl truncate">{tokenData.name}</h1>
                      <span className="text-sm sm:text-base md:text-lg opacity-70">${tokenData.ticker}</span>
                    </>
                  ) : (
                    <>
                      <SkeletonBar className="h-8 w-32" />
                      <SkeletonBar className="h-6 w-20" />
                    </>
                  )}
                  <div className="w-full sm:w-auto flex items-center gap-2 px-2 py-1 bg-black/40 rounded-lg border border-[#00ff00]/20">
                    {tokenData ? (
                      <>
                        <a
                          href={getSolscanTokenUrl(tokenData.contractAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs md:text-sm text-[#00ff00] hover:text-[#00ff00]/80 transition-colors flex items-center gap-1"
                        >
                          {tokenData.contractAddressShort}
                          <ExternalLink size={12} className="opacity-50" />
                        </a>
                        <button
                          onClick={handleCopyAddress}
                          className="p-1 rounded hover:bg-[#00ff00]/10 transition-colors"
                          title="Copy full address"
                        >
                          {copied ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} className="text-[#00ff00]/70" />
                          )}
                        </button>
                      </>
                    ) : (
                      <SkeletonBar className="h-6 w-36" />
                    )}
                  </div>
                </div>

                {/* Social Links and Price */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    {tokenData ? (
                      <>
                        {tokenData?.socialLinks?.website && <a href={tokenData?.socialLinks?.website} target="_blank" rel="noopener noreferrer" className="terminal-button p-1.5">
                          <Globe size={14} />
                        </a>}
                        {tokenData?.socialLinks?.twitter && <a href={tokenData?.socialLinks?.twitter} target="_blank" rel="noopener noreferrer" className="terminal-button p-1.5">
                          <XLogo className="w-3.5 h-3.5 text-[#00ff00]" />
                        </a>}
                        {tokenData?.socialLinks?.telegram && <a href={tokenData?.socialLinks?.telegram} target="_blank" rel="noopener noreferrer" className="terminal-button p-1.5">
                          <TelegramLogo className="w-3.5 h-3.5 text-[#00ff00]" />
                        </a>}
                        {connected && publicKey && <button
                          onClick={() => setIsPnlModalOpen(true)}
                          className="terminal-button ml-6 px-3 py-1.5 flex items-center gap-2 relative group animate-pulse hover:animate-none"
                          title="Share Your P&L"
                        >
                          <Share size={14} />
                          <span className="text-xs">P&L</span>
                          <div className="absolute inset-0 rounded border border-[#00ff00]/50 animate-ping"></div>
                        </button>}
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <SkeletonBar className="h-8 w-8" />
                        <SkeletonBar className="h-8 w-8" />
                        <SkeletonBar className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {tokenData ? (
                      <>
                        <div className="text-sm sm:text-base md:text-xl">{price ? formatPrice(price) : '--'}</div>
                        {tokenData.priceChange24h !== 0 && (
                          <div className={`flex items-center justify-end text-xs md:text-sm ${tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tokenData.priceChange24h >= 0 ? <TrendUp size={14} /> : <TrendingDown size={14} />}
                            <span className="ml-1">{tokenData.priceChange24h}%</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <SkeletonBar className="h-7 w-24 ml-auto" />
                        <SkeletonBar className="h-5 w-16 ml-auto" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description - Shown on both mobile and desktop with different styling */}
          {tokenData ? (
            <p className="terminal-text text-xs md:text-sm opacity-80 line-clamp-2 sm:line-clamp-none">
              {tokenData.description}
            </p>
          ) : (
            <div className="space-y-2">
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-3/4" />
            </div>
          )}
        </div>
      </div>

      {/* Chart and Trade Panel Section */}
      <div className="terminal-card p-3 sm:p-4 mb-4">
        <h2 className="terminal-header mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">&gt; MARKET_DATA</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Chart */}
          <div className="lg:col-span-2">
            {tokenData ? (
              <div className="h-[450px] lg:h-full">
                <PriceChartWidget poolAddress={tokenData?.poolAddress.toString() || ''} />
              </div>
            ) : (
              <div className="h-[450px] lg:h-full bg-white/10 animate-pulse" />
            )}
          </div>

          {/* Trade Panel */}
          <div className="lg:col-span-1">
            {tokenData ? (
              <TradePanel
                tokenSymbol={tokenData?.ticker}
                tokenMintAddress={tokenAddress!}
                poolId={new PublicKey(tokenData?.poolAddress)}
                tokenPrice={price}
                tokenPriceInSol={priceInSol}
                solBalance={solBalance}
                tokenBalance={tokenBalance}
                updatePrice={updatePrice}
                updateBalances={updateBalances}
                tokenTax={tokenData.taxInfo.total}
                distributionTokenMintAddress={new PublicKey(tokenData.taxInfo.distributionToken?.address)}
              />
            ) : (
              <div className="w-full h-full bg-white/10 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-4">
        <TokenStatsOverview
          stats={{
            marketCap: tokenData.marketCap,
            holders: tokenData.holders,
            volume24h: tokenData.volume24h,
            glitched: tokenData.glitched,
            glitchType: tokenData.glitchType
          }}
          taxInfo={{
            total: tokenData.taxInfo.total,
            burn: tokenData.taxInfo.burn,
            distribute: tokenData.taxInfo.distribute,
            interval: tokenData.interval,
            distributionToken: tokenData.taxInfo.distributionToken,
            distributionWallet: tokenData.taxInfo.distributionWallet,
            burnWallet: tokenData.taxInfo.burnWallet
          }}
        />
      </div>

      {/* Rewards Calculator Section */}
      {tokenData.taxInfo.distribute !== 0 && (
        <div className="mb-4">
          <RewardsCalculator
            distributionFee={Number(tokenData.taxInfo.distribute)}
            volume24h={tokenData.volume24h || 0}
            totalSupply={tokenData.totalSupply / 10 ** 6 || 1000000000}
            userTokenBalance={tokenBalance}
            userTokenSymbol={tokenData.ticker}
            distributionTokenSymbol={tokenData.taxInfo.distributionToken.symbol || 'Distribution Token'}
            distributionTokenPrice={125}
          />
        </div>
      )}

      {/* Holders and Transactions Section */}
      <div className="terminal-card p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Tab Buttons */}
          <div className="w-full sm:w-auto flex">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 sm:flex-none terminal-button px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${activeTab === 'transactions' ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''
                }`}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                TRANSACTIONS
              </span>
            </button>
            <button
              onClick={() => setActiveTab('holders')}
              className={`flex-1 sm:flex-none terminal-button px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-l-none border-l-0 ${activeTab === 'holders' ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''
                }`}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Users size={14} className="sm:w-4 sm:h-4" />
                HOLDERS
              </span>
            </button>
          </div>

          {/* View All Holders Button */}
          {activeTab === 'holders' && (
            <a
              href={getSolscanTokenHoldersUrl(tokenData?.contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto terminal-button px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center justify-center gap-2 group"
            >
              <span>VIEW_ALL_HOLDERS</span>
              <ExternalLink size={14} className="text-[#00ff00]" />
            </a>
          )}
        </div>

        {/* Tables with horizontal scroll on mobile */}
        <div className="-mx-3 sm:mx-0">
          <div className="overflow-x-auto">
            {activeTab === 'transactions' && (
              <table className="w-full text-xs sm:text-sm md:text-base">
                <thead>
                  <tr className="text-left">
                    <th className="terminal-dim pb-4 text-xs sm:text-xs">&gt; TIME</th>
                    <th className="terminal-dim pb-4 text-xs sm:text-xs">&gt; TYPE</th>
                    <th className="terminal-dim pb-4 text-xs sm:text-xs">&gt; AMOUNT (USD)</th>
                    <th className="terminal-dim pb-4 text-xs sm:text-xs">&gt; AMOUNT (SOL)</th>
                    <th className="terminal-dim pb-4 text-xs sm:text-xs">&gt; TX</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-[#00ff00]/20">
                      <td className="py-4">
                        {tx.timestamp}
                      </td>
                      <td className="py-4">
                        {tx.timestamp && (
                          <div className={`flex items-center ${tx.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.type === 'BUY' ?
                              <ArrowUpRight size={16} className="mr-1" /> :
                              <ArrowDownRight size={16} className="mr-1" />
                            }
                            {tx.type || '--'}
                          </div>
                        )}
                      </td>
                      <td className="py-4">{formatCurrency(tx.amountUsd)}</td>
                      <td className="py-4">{formatSolAmount(tx.amountSol)}</td>
                      <td className="py-4">{formatTxHash(tx.txHash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'holders' && (
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="terminal-dim pb-4">&gt; WALLET</th>
                    <th className="terminal-dim pb-4">&gt; TOKEN_ACCOUNT</th>
                    <th className="terminal-dim pb-4 text-right">&gt; BALANCE</th>
                    <th className="terminal-dim pb-4 text-right">&gt; %</th>
                    <th className="terminal-dim pb-4 text-right">&gt; VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map((holder) => (
                    <tr
                      key={holder.address}
                      className="border-t border-[#00ff00]/20 hover:bg-[#00ff00]/5 transition-colors"
                    >
                      <td className="py-4">
                        <a
                          href={getSolscanUrl(holder.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono flex items-center gap-1 hover:text-[#00ff00] transition-colors"
                        >
                          {`${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`}
                          <ExternalLink size={12} className="opacity-50" />
                        </a>
                      </td>
                      <td className="py-4">
                        <a
                          href={getSolscanUrl(holder.tokenAccount)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono flex items-center gap-1 hover:text-[#00ff00] transition-colors"
                        >
                          {`${holder.tokenAccount.slice(0, 6)}...${holder.tokenAccount.slice(-4)}`}
                          <ExternalLink size={12} className="opacity-50" />
                        </a>
                      </td>
                      <td className="py-4 text-right font-mono">
                        {formatBalance(holder.balance)} {tokenData.ticker}
                      </td>
                      <td className="py-4 text-right font-mono text-[#00ff00]">
                        {holder.percentage.toFixed(3)}%
                      </td>
                      <td className="py-4 text-right font-mono">
                        {formatCurrency(holder.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section
      <div className="mt-4">
        <CommentSection tokenId={tokenId || ''} />
      </div> */}

      <PnlCalculatorModal
        isOpen={isPnlModalOpen}
        onClose={() => setIsPnlModalOpen(false)}
        tokenSymbol={tokenData?.ticker}
        tokenAddress={tokenAddress?.toString() || ''}
        remainingTokenAmount={tokenBalance}
        currentTokenPrice={price}
        currentDistributionTokenPrice={125}
        distributionTokenSymbol={tokenData.taxInfo.distributionToken.symbol || 'Distribution Token'}
      />
    </div >
  );
}