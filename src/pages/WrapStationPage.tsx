import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NATIVE_MINT } from '@solana/spl-token';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { Transaction, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { buildWrapSolInstruction, buildUnwrapSolInstruction } from '../utils/instructionBuilders';
import { BN } from '@coral-xyz/anchor';

// Move connection outside the component to prevent recreation on each render
const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);

function WrapStationPage() {
    // State for wrap section
    const [wrapAmount, setWrapAmount] = useState<string>('');
    const [isWrapping, setIsWrapping] = useState(false);
    const [wrapSuccess, setWrapSuccess] = useState<string | null>(null);

    const { publicKey, sendTransaction } = useWallet();

    // State for unwrap section
    const [isUnwrapping, setIsUnwrapping] = useState(false);
    const [unwrapSuccess, setUnwrapSuccess] = useState<string | null>(null);
    const [wsolBalance, setWsolBalance] = useState<number>(0);
    const [solBalance, setSolBalance] = useState<number>(0);
    // State for info section
    const [showInfo, setShowInfo] = useState(false);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    // TODO: Get wallet connection status from context
    const isWalletConnected = !!publicKey;

    const refreshBalances = async () => {
        if (!publicKey) return;
        setIsBalanceLoading(true);
        try {
            // Get SOL balance
            const solBal = await connection.getBalance(publicKey);
            setSolBalance(solBal / LAMPORTS_PER_SOL);

            // Get wSOL balance
            const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, publicKey);
            try {
                const tokenAccount = await connection.getTokenAccountBalance(wsolAta);
                setWsolBalance(Number(tokenAccount.value.uiAmount) || 0);
            } catch {
                setWsolBalance(0);
            }
        } catch (error) {
            console.error('Error refreshing balances:', error);
        } finally {
            setIsBalanceLoading(false);
        }
    };

    // Update the useEffect to use the refreshBalances function
    useEffect(() => {
        if (!publicKey) return;

        refreshBalances();
        const intervalId = setInterval(refreshBalances, 30000);

        return () => clearInterval(intervalId);
    }, [publicKey]);

    const handleWrap = async () => {
        if (!publicKey || !wrapAmount || isWrapping) return;

        setIsWrapping(true);
        setWrapSuccess(null);

        try {
            const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, publicKey);
            const transaction = new Transaction();

            // Check if wSOL account exists, if not create it
            try {
                await connection.getAccountInfo(wsolAta);
            } catch {
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        wsolAta,
                        publicKey,
                        NATIVE_MINT
                    )
                );
            }

            // Add wrap SOL instruction
            const wrapInstruction = await buildWrapSolInstruction(
                publicKey,
                new BN(Number(wrapAmount) * LAMPORTS_PER_SOL)
            );
            transaction.add(wrapInstruction);

            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'finalized');

            setWrapSuccess(`${wrapAmount} SOL successfully wrapped.`);
            setWrapAmount('');
            await refreshBalances();
        } catch (error) {
            console.error('Error wrapping SOL:', error);
            setWrapSuccess('Failed to wrap SOL. Please try again.');
        } finally {
            setIsWrapping(false);
        }
    };

    const handleUnwrap = async () => {
        if (!publicKey || wsolBalance <= 0 || isUnwrapping) return;

        setIsUnwrapping(true);
        setUnwrapSuccess(null);

        try {
            // Use the unwrap instruction builder
            const unwrapInstruction = buildUnwrapSolInstruction(publicKey);
            const transaction = new Transaction().add(unwrapInstruction);

            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'finalized');

            setUnwrapSuccess(`${wsolBalance} wSOL unwrapped and returned.`);
            await refreshBalances();
        } catch (error) {
            console.error('Error unwrapping SOL:', error);
            setUnwrapSuccess('Failed to unwrap SOL. Please try again.');
        } finally {
            setIsUnwrapping(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="mb-6">
                <Link
                    to="/"
                    className="terminal-card bg-gradient-to-br from-[#001a00] to-black border-2 border-[#00ff00]/30 px-4 py-2 text-sm inline-flex items-center gap-2 group hover:border-[#00ff00]/50 hover:shadow-[0_0_20px_rgba(0,255,0,0.2)] transition-all duration-300 relative overflow-hidden"
                >
                    {/* Background Effects */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                        style={{
                            background: 'radial-gradient(circle at center, rgba(0, 255, 0, 0.2) 0%, transparent 70%)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                        <ArrowLeft size={16} className="text-[#00ff00] transform group-hover:-translate-x-1 transition-transform duration-300" />
                        <span className="font-mono">&gt; RETURN_HOME</span>
                    </div>
                </Link>
            </div>

            <div className="terminal-card bg-gradient-to-br from-[#001a00] to-black border-2 border-[#00ff00]/30 shadow-[0_0_30px_rgba(0,255,0,0.1)] p-6 relative overflow-hidden">
                {/* Background Effects */}
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

                <div className="relative z-10 space-y-8">
                    {/* Wrap Section */}
                    <div className="space-y-4">
                        <h2 className="terminal-header text-xl">&gt; WRAP_SOL</h2>
                        <div className="bg-black/40 p-4 rounded border border-[#00ff00]/20 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="opacity-70">Available SOL Balance:</span>
                                {isBalanceLoading ? (
                                    <div className="h-6 w-24 bg-[#00ff00]/10 animate-pulse rounded" />
                                ) : (
                                    <span className="font-mono text-[#00ff00]">{solBalance.toFixed(4)} SOL</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-2">
                                <input
                                    type="number"
                                    value={wrapAmount}
                                    onChange={(e) => setWrapAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="terminal-input w-full px-4 py-2 bg-black/40 border-[#00ff00]/20 focus:border-[#00ff00] focus:bg-black/60 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                    disabled={!isWalletConnected || isWrapping}
                                />
                                {wrapAmount && (
                                    <div className="text-xs font-mono opacity-70">
                                        This will wrap {wrapAmount} SOL into wSOL.
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleWrap}
                                disabled={!isWalletConnected || !wrapAmount || isWrapping}
                                className="terminal-button px-6 py-2 min-w-[120px] flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-[#00ff00]/10 transition-all duration-300"
                            >
                                {isWrapping ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Wrapping...
                                    </>
                                ) : (
                                    'Wrap SOL'
                                )}
                            </button>
                        </div>
                        {wrapSuccess && (
                            <div className="font-mono text-sm opacity-70 pl-2 border-l-2 border-[#00ff00]/30">
                                &gt; {wrapSuccess}
                            </div>
                        )}
                    </div>

                    {/* Unwrap Section */}
                    <div className="space-y-4">
                        <h2 className="terminal-header text-xl">&gt; UNWRAP_SOL</h2>
                        <div className="bg-black/40 p-4 rounded border border-[#00ff00]/20">
                            <div className="flex items-center justify-between mb-4">
                                <span className="opacity-70">Current wSOL Balance:</span>
                                {isBalanceLoading ? (
                                    <div className="h-6 w-24 bg-[#00ff00]/10 animate-pulse rounded" />
                                ) : (
                                    <span className="font-mono text-[#00ff00]">{wsolBalance} wSOL</span>
                                )}
                            </div>
                            <button
                                onClick={handleUnwrap}
                                disabled={!isWalletConnected || wsolBalance === 0 || isUnwrapping}
                                className="terminal-button w-full py-2 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-[#00ff00]/10 transition-all duration-300"
                            >
                                {isUnwrapping ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Unwrapping...
                                    </>
                                ) : (
                                    'Unwrap All'
                                )}
                            </button>
                        </div>
                        {unwrapSuccess && (
                            <div className="font-mono text-sm opacity-70 pl-2 border-l-2 border-[#00ff00]/30">
                                &gt; {unwrapSuccess}
                            </div>
                        )}

                        {/* Info Section with Collapsible Content */}
                        <div className="bg-black/40 rounded border border-yellow-500/20">
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className="w-full p-4 flex items-center justify-between text-yellow-500 hover:bg-[#00ff00]/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <HelpCircle size={16} />
                                    <span className="font-bold">What is wSOL and wrapping?</span>
                                </div>
                                {showInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {/* Collapsible Content */}
                            <div className={`overflow-hidden transition-all duration-300 ${showInfo ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 space-y-4 text-sm opacity-80 border-t border-yellow-500/20">
                                    <div>
                                        <p className="font-bold mb-2">Wrap and Unwrap SOL:</p>
                                        <p>Wrapped SOL (wSOL) is a special version of SOL used within the Solana ecosystem. While SOL is the native token of Solana, certain decentralized applications (dApps) require it to be in the form of a wrapped token (wSOL) for compatibility with their smart contracts and decentralized finance (DeFi) protocols. Wrapped SOL is still SOL—just in a form that can interact more easily with these dApps.</p>
                                    </div>

                                    <div>
                                        <p className="font-bold mb-2">Here's how it works:</p>
                                        <div className="space-y-2">
                                            <p><span className="text-[#00ff00]">Wrapping SOL:</span> When you wrap SOL, you're converting it into wSOL. This is done by sending your SOL to a special account where it's "wrapped" and a token representing the wrapped SOL is issued to you.</p>
                                            <p><span className="text-[#00ff00]">Unwrapping SOL:</span> When you unwrap wSOL, you're sending your wrapped SOL back to the system, and it converts back into regular SOL in your wallet. The special wrapped account is also closed once the unwrapping is complete.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-bold mb-2">Key Points:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>wSOL is still Solana's native SOL token, just in a form that can be used for decentralized applications (dApps).</li>
                                            <li>Wrapping and unwrapping are required steps to use SOL in many DeFi protocols and smart contracts.</li>
                                            <li>Partial unwrapping isn't possible on Solana—you'll need to unwrap all wSOL in one action.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="font-bold mb-2">What happens when you unwrap?</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Your wrapped SOL (wSOL) will be converted back into regular SOL in your wallet.</li>
                                            <li>The special account used to hold wSOL will be closed.</li>
                                        </ul>
                                    </div>

                                    <p className="italic">Remember: Wrapping and unwrapping are both seamless and crucial to interact with the Solana ecosystem effectively.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WrapStationPage;