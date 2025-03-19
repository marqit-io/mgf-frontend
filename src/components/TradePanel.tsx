import { PublicKey, Connection } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { buildBuyInstruction, buildSellInstruction, buildWrapSolInstruction, buildUnwrapSolInstruction } from '../utils/instructionBuilders';
import { Transaction } from '@solana/web3.js';
import { WSOLMint } from "@raydium-io/raydium-sdk-v2";
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';

interface TradePanelProps {
  tokenSymbol: string;
  poolId: PublicKey;
  tokenMintAddress: PublicKey;
  tokenPriceInSol: number;
  tokenPrice: number;
  tokenTax: number;
  tokenBalance: number;
  solBalance: number;
  distributionTokenMintAddress: PublicKey;
  updatePrice: () => Promise<void>;
  updateBalances: () => Promise<void>;
}

export function TradePanel({ tokenSymbol, tokenMintAddress, poolId, tokenPriceInSol, tokenPrice, tokenTax, distributionTokenMintAddress, tokenBalance = 0, solBalance = 0, updatePrice, updateBalances }: TradePanelProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('1');
  const { publicKey, connected, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<number | null>(null);
  const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
  const [success, setSuccess] = useState<{ message: string; signature: string } | null>(null);

  // Calculate amounts based on trade type
  const inputAmount = parseFloat(amount || '0');

  // Add this near the top of the component
  const slippageOptions = ['0.5', '1', '2', '3'];

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

  // Replace handleTrade with this implementation
  const handleTrade = async () => {
    if (!connected || !signTransaction || !publicKey || !poolId) {
      setError('Please connect your wallet to trade');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      validateTrade();

      const tx = new Transaction();

      // Only try to create distribution token account if it exists
      if (distributionTokenMintAddress) {
        const distributionTokenAccount = getAssociatedTokenAddressSync(
          distributionTokenMintAddress,
          publicKey
        );

        try {
          await connection.getAccountInfo(distributionTokenAccount);
        } catch (e) {
          const createTokenAccountIx = createAssociatedTokenAccountInstruction(
            publicKey,
            distributionTokenAccount,
            publicKey,
            distributionTokenMintAddress
          );
          tx.add(createTokenAccountIx);
        }
      }

      if (tradeType === 'buy') {
        const inputAmount = new BN(Math.floor(parseFloat(amount) * 1e9)); // Convert to lamports
        // Add wrap SOL instruction if buying
        const wrapSolIx = await buildWrapSolInstruction(publicKey, inputAmount);
        tx.add(wrapSolIx);

        // Add buy instruction
        const buyIx = await buildBuyInstruction(
          publicKey,
          poolId,
          WSOLMint, // Input mint (SOL)
          tokenMintAddress, // Output mint (Token)
          Number(slippage) / 100,
          inputAmount
        );
        tx.add(buyIx);

        // Add unwrap SOL instruction for any remaining WSOL
        const unwrapSolIx = await buildUnwrapSolInstruction(publicKey);
        tx.add(unwrapSolIx);
      } else {
        const inputAmount = new BN(Math.floor(parseFloat(amount) * 1e6)); // Convert to lamports

        // Add sell instruction
        const sellIx = await buildSellInstruction(
          publicKey,
          poolId,
          tokenMintAddress, // Input mint (Token)
          WSOLMint, // Output mint (SOL)
          Number(slippage) / 100,
          inputAmount
        );
        tx.add(sellIx);

        // Add unwrap SOL instruction to get native SOL
        const unwrapSolIx = await buildUnwrapSolInstruction(publicKey);
        tx.add(unwrapSolIx);
      }

      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      const latestBlockHash = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight
      }, 'finalized');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // Clear form
      setAmount('');
      setEstimatedOutput(null);

      // Wait for balances to update on-chain
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updateBalances();
      await updatePrice();

      // Set success message
      setSuccess({
        message: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${amount} ${tradeType === 'buy' ? 'SOL' : tokenSymbol}`,
        signature
      });

    } catch (error) {
      console.error('Trade failed:', error);
      setError(error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Modify the quote fetching logic
  useEffect(() => {
    const fetchQuote = async () => {
      if (!inputAmount || inputAmount <= 0 || !poolId) {
        setEstimatedOutput(null);
        return;
      }

      try {

        // Here you would calculate the expected output based on Raydium pool state
        // This is a simplified example - you'll need to implement proper price impact calculation
        const outAmount = tradeType === 'buy'
          ? inputAmount / tokenPriceInSol * (10000 - tokenTax) / 10000
          : inputAmount * tokenPriceInSol * (10000 - tokenTax) / 10000;

        setEstimatedOutput(outAmount);
      } catch (error) {
        console.error('Error fetching quote:', error);
        setEstimatedOutput(null);
      }
    };

    fetchQuote();
  }, [amount, tradeType, tokenMintAddress, poolId, tokenPrice]);

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
        <div className="space-y-2 mb-6">
          <label className="block text-sm">
            &gt; SLIPPAGE_TOLERANCE
          </label>
          <div className="flex gap-2">
            {slippageOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSlippage(option)}
                className={`px-3 py-2 text-xs transition-all duration-200 border ${slippage === option
                  ? 'bg-[#00ff00]/20 border-[#00ff00] text-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                  : 'terminal-button hover:bg-[#00ff00]/10'
                  }`}
              >
                {option}%
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