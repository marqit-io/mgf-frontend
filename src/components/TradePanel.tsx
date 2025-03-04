import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2 } from 'lucide-react';
import { getSolBalance, getTokenBalance } from '../utils/getData';
import { useWallet } from '@solana/wallet-adapter-react';
import { getMint } from '@solana/spl-token';

interface TradePanelProps {
  tokenSymbol: string;
  tokenPrice: number;
  tokenMintAddress: PublicKey;
}

export function TradePanel({ tokenSymbol, tokenPrice, tokenMintAddress }: TradePanelProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('1');
  const { publicKey, connected, signTransaction } = useWallet();
  const [solBalance, setSolBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<number | null>(null);
  const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [success, setSuccess] = useState<{ message: string; signature: string } | null>(null);

  useEffect(() => {
    if (publicKey) {
      getSolBalance(publicKey).then(setSolBalance);
      getTokenBalance(publicKey, tokenMintAddress).then(setTokenBalance);
    }
  }, [publicKey, tokenMintAddress]);

  // Calculate amounts based on trade type
  const inputAmount = parseFloat(amount || '0');

  const handleSetMaxAmount = () => {
    if (tradeType === 'buy') {
      // For buy, set max SOL amount minus a small buffer for fees
      const maxSol = Math.max(0, solBalance - 0.01);
      setAmount(maxSol.toString());
    } else {
      // For sell, use entire token balance
      setAmount(tokenBalance.toString());
    }
  };

  const validateTrade = () => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Please enter a valid amount');
    }

    if (tradeType === 'buy') {
      if (inputAmount > solBalance) {
        throw new Error('Insufficient SOL balance');
      }
    } else {
      if (inputAmount > tokenBalance) {
        throw new Error('Insufficient token balance');
      }
    }
  };

  // Fetch quote when amount or trade type changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!inputAmount || inputAmount <= 0) {
        setEstimatedOutput(null);
        return;
      }

      try {
        const inputMint = tradeType === 'buy'
          ? 'So11111111111111111111111111111111111111112'
          : tokenMintAddress.toString();

        const outputMint = tradeType === 'buy'
          ? tokenMintAddress.toString()
          : 'So11111111111111111111111111111111111111112';

        // Get input token decimals
        const inDecimals = inputMint === 'So11111111111111111111111111111111111111112'
          ? 9  // SOL has 9 decimals
          : (await getMint(connection, new PublicKey(inputMint))).decimals;

        // Convert to smallest unit based on input token decimals
        const rawAmount = Math.floor(inputAmount * (10 ** inDecimals));

        const quoteResponse = await fetch(
          `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${rawAmount}&slippageBps=${parseFloat(slippage) * 100}&onlyDirectRoutes=false`
        ).then(res => res.json());

        const outDecimals = (await getMint(connection, new PublicKey(outputMint))).decimals;

        if (quoteResponse && !quoteResponse.error) {
          const outAmount = parseInt(quoteResponse.outAmount) / 10 ** outDecimals;
          setEstimatedOutput(outAmount);
          setQuoteResponse(quoteResponse);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setEstimatedOutput(null);
      }
    };

    fetchQuote();
  }, [amount, tradeType, tokenMintAddress, slippage]);

  // Add function to update balances
  const updateBalances = async () => {
    if (publicKey) {
      const [newSolBalance, newTokenBalance] = await Promise.all([
        getSolBalance(publicKey),
        getTokenBalance(publicKey, tokenMintAddress)
      ]);
      setSolBalance(newSolBalance);
      setTokenBalance(newTokenBalance);
    }
  };

  // Update balances periodically while success message is shown
  useEffect(() => {
    const interval = setInterval(updateBalances, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTrade = async () => {
    if (!connected || !signTransaction || !publicKey) {
      setError('Please connect your wallet to trade');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      validateTrade();

      if (!quoteResponse) {
        throw new Error('No quote response');
      }

      // Execute swap with Jupiter
      const swapResponse = await (
        await fetch('https://api.jup.ag/swap/v1/swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey: publicKey,
            dynamicComputeUnitLimit: true,
            dynamicSlippage: true,
            prioritizationFeeLamports: {
              priorityLevelWithMaxLamports: {
                maxLamports: 1000000,
                priorityLevel: "veryHigh"
              }
            }
          })
        })
      ).json();

      if (!swapResponse || !swapResponse.swapTransaction) {
        throw new Error(swapResponse.error || 'Failed to create swap transaction');
      }

      const transaction = VersionedTransaction.deserialize(Buffer.from(swapResponse.swapTransaction, 'base64'));
      const signedTransaction = await signTransaction(transaction);

      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      const confirmation = await connection.confirmTransaction(
        { signature, lastValidBlockHeight: swapResponse.lastValidBlockHeight, blockhash: swapResponse.blockhash },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // Clear form and update balances
      setAmount('');
      setEstimatedOutput(null);
      await updateBalances();

      // Set success message
      setSuccess({
        message: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${inputAmount.toFixed(4)} ${tradeType === 'buy' ? 'SOL' : tokenSymbol
          }`,
        signature
      });

    } catch (error) {
      console.error('Trade failed:', error);
      setError(error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="trade-panel p-6">
      <h2 className="terminal-header mb-6 text-xl">&gt; TRADE_INTERFACE</h2>

      {/* Trade Type Selection */}
      <div className="flex gap-4 mb-6">
        <button
          className={`flex-1 py-3 flex items-center justify-center gap-2 rounded border ${tradeType === 'buy'
            ? 'trade-button-buy border-[#00ff00]'
            : 'terminal-button'
            }`}
          onClick={() => {
            setTradeType('buy');
            setAmount('');
            setEstimatedOutput(null);
          }}
          disabled={isLoading}
        >
          <ArrowUpRight size={16} className="text-green-400" />
          BUY
        </button>
        <button
          className={`flex-1 py-3 flex items-center justify-center gap-2 rounded border ${tradeType === 'sell'
            ? 'trade-button-sell border-red-500'
            : 'terminal-button'
            }`}
          onClick={() => {
            setTradeType('sell');
            setAmount('');
            setEstimatedOutput(null);
          }}
          disabled={isLoading}
        >
          <ArrowDownRight size={16} className="text-red-400" />
          SELL
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm mb-2">
            &gt; {tradeType === 'buy' ? 'SOL AMOUNT' : `${tokenSymbol} AMOUNT`}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="terminal-input flex-1 px-3 py-2 bg-black/30"
              placeholder="0.00"
              disabled={isLoading}
              min="0"
              step="0.000001"
            />
            <button
              className="terminal-button px-3 hover:bg-[#00ff00]/10"
              onClick={handleSetMaxAmount}
              disabled={isLoading}
            >
              MAX
            </button>
          </div>
          {/* Balance Display */}
          <div className="text-xs text-[#00ff00]/70 mt-1">
            Balance: {tradeType === 'buy'
              ? `${solBalance.toFixed(4)} SOL`
              : `${tokenBalance.toFixed(4)} ${tokenSymbol}`}
          </div>
        </div>

        {/* Slippage Settings */}
        <div>
          <label className="block text-sm mb-2">&gt; SLIPPAGE_TOLERANCE</label>
          <div className="flex gap-2">
            {['0.5', '1', '2', '3'].map((value) => (
              <button
                key={value}
                className={`terminal-button px-3 py-1 transition-all duration-200 ${slippage === value ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''
                  }`}
                onClick={() => setSlippage(value)}
                disabled={isLoading}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="space-y-2 mb-6 p-4 bg-black/30 rounded border border-[#00ff00]/20">
        <div className="flex justify-between">
          <span className="text-sm opacity-70">Price:</span>
          <span className="trade-amount font-mono">${tokenPrice.toFixed(6)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm opacity-70">
            {tradeType === 'buy' ? 'You Pay:' : 'You Sell:'}
          </span>
          <span className="trade-amount font-mono">
            {inputAmount.toFixed(4)} {tradeType === 'buy' ? 'SOL' : tokenSymbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm opacity-70">
            {tradeType === 'buy' ? 'You Receive:' : 'You Receive:'}
          </span>
          <span className="trade-amount font-mono">
            {estimatedOutput !== null
              ? `${estimatedOutput.toFixed(4)} ${tradeType === 'buy' ? tokenSymbol : 'SOL'}`
              : '...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm opacity-70">Slippage Tolerance:</span>
          <span className="opacity-70 font-mono">{slippage}%</span>
        </div>
        <div className="flex justify-between border-t border-[#00ff00]/20 pt-2 mt-2">
          <span>Minimum Received:</span>
          <span className="trade-amount font-mono text-[#00ff00]">
            {estimatedOutput !== null
              ? `${(estimatedOutput * (1 - parseFloat(slippage) / 100)).toFixed(4)} ${tradeType === 'buy' ? tokenSymbol : 'SOL'
              }`
              : '...'}
          </span>
        </div>
      </div>

      {/* Success Display */}
      {success && (
        <div className="mb-4 p-3 border border-[#00ff00] bg-[#00ff00]/10 rounded text-[#00ff00] text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          <div className="flex-1">
            {success.message}
            <a
              href={`https://solscan.io/tx/${success.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs opacity-70 hover:opacity-100 underline"
            >
              View transaction
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 border border-red-500 bg-red-500/10 rounded text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Trade Button */}
      <button
        className={`w-full py-3 rounded flex items-center justify-center gap-2 font-bold transition-all duration-300 ${tradeType === 'buy'
          ? 'trade-button-buy border border-[#00ff00]'
          : 'trade-button-sell border border-red-500'
          }`}
        onClick={handleTrade}
        disabled={isLoading || !connected || !estimatedOutput}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            PROCESSING...
          </>
        ) : connected ? (
          `> EXECUTE_${tradeType.toUpperCase()}`
        ) : (
          '> CONNECT_WALLET_TO_TRADE'
        )}
      </button>
    </div>
  );
}