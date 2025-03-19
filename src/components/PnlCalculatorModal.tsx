import { useState, useRef, useEffect } from 'react';
import { Download, Copy, X, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useWallet } from '@solana/wallet-adapter-react';

interface PnlCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenSymbol: string;
    tokenAddress: string;
    remainingTokenAmount: number;
    currentTokenPrice: number;
    currentDistributionTokenPrice: number;
    distributionTokenSymbol: string
}

interface PnlData {
    totalBought: number;
    totalSold: number;
    totalRewards: number;
}

export function PnlCalculatorModal({
    isOpen,
    onClose,
    tokenSymbol,
    tokenAddress,
    remainingTokenAmount,
    currentTokenPrice,
    currentDistributionTokenPrice,
    distributionTokenSymbol
}: PnlCalculatorModalProps) {
    const { publicKey } = useWallet();
    const [pnlData, setPnlData] = useState<PnlData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const pnlCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && publicKey) {
            setTimeout(() => {
                const mockPnlData: PnlData = {
                    totalBought: 1000,    // Total USD value of tokens bought
                    totalSold: 600,       // Total USD value of tokens sold
                    totalRewards: 20      // Total USD value of rewards received
                };
                setPnlData(mockPnlData);
                setIsLoading(false);
            }, 1000);
        }
    }, [isOpen, publicKey]);

    // Calculate total PNL
    const totalPnl = (pnlData?.totalSold || 0) - (pnlData?.totalBought || 0) +
        (remainingTokenAmount * currentTokenPrice) +
        (pnlData?.totalRewards || 0) * currentDistributionTokenPrice;

    // Calculate percentage return
    const percentageReturn = ((totalPnl / (pnlData?.totalBought || 1)) * 100);

    const handleCopyImage = async () => {
        if (!pnlCardRef.current) return;
        try {
            const canvas = await html2canvas(pnlCardRef.current);
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        } catch (error) {
            console.error('Error copying image:', error);
        }
    };

    const handleDownloadImage = async () => {
        if (!pnlCardRef.current) return;
        try {
            const canvas = await html2canvas(pnlCardRef.current);
            const link = document.createElement('a');
            link.download = `${tokenSymbol}-pnl.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black/90 border border-[#00ff00]/20 rounded-lg p-6 max-w-[calc(100vw-32px)] overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#00ff00]">&gt; SHARE_YOUR_GAINS</h2>
                    <button onClick={onClose} className="border border-[#00ff00] text-[#00ff00] hover:text-[#00ff00]/80 p-2">
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse text-[#00ff00]">Loading PNL data...</div>
                    </div>
                ) : (
                    <>
                        <div ref={pnlCardRef}
                            className="rounded-lg p-6 relative overflow-hidden bg-black"
                            style={{
                                backgroundImage: `linear-gradient(135deg, rgba(0, 15, 0, 0.95) 0%, rgba(0, 5, 0, 0.98) 100%)`
                            }}
                        >
                            {/* Grid Background */}
                            <div className="absolute inset-[-100%] opacity-[0.08]" style={{
                                backgroundImage: `linear-gradient(to bottom, #00ff00 1px, transparent 1px)`,
                                backgroundSize: '15px 15px',
                                transform: 'rotate(45deg)',
                                transformOrigin: 'center center'
                            }} />

                            {/* Content wrapper with padding */}
                            <div className="relative h-full flex flex-col">
                                {/* Brand */}
                                <div className="flex items-center gap-2 mb-6">
                                    <Zap size={20} className="text-[#00ff00]" />
                                    <span className="text-xl font-mono font-bold text-[#00ff00] tracking-[2px]" style={{
                                        fontFamily: 'Source Code Pro, monospace',
                                        textShadow: '0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5), 0 0 15px rgba(0, 255, 0, 0.3)'
                                    }}>
                                        MONEYGLITCH.FUN
                                    </span>
                                </div>

                                {/* Token Info and Total */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-[#00ff00]/80 mb-1">GAINS WITH {tokenSymbol}</div>
                                        <div className="text-2xl text-[#00ff00] font-mono font-bold">${tokenSymbol}</div>
                                    </div>
                                    <div className={`text-right ${totalPnl >= 0 ? 'text-[#00ff00]' : 'text-[#ff3b30]'}`}>
                                        <div className="text-3xl font-mono font-bold">
                                            {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
                                        </div>
                                        <div className="text-lg opacity-80">
                                            {percentageReturn >= 0 ? '+' : ''}{percentageReturn.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* Total Bought Box */}
                                    <div className="border-2 border-[#00ff00]/20 p-4 rounded-lg bg-[#00ff00]/10">
                                        <div className="text-[#00ff00]/70 mb-1">TOTAL BOUGHT</div>
                                        <div className="text-xl text-[#00ff00] font-mono">${pnlData?.totalBought.toFixed(2)}</div>
                                    </div>

                                    {/* Total Sold Box */}
                                    <div className="border-2 border-[#00ff00]/20 p-4 rounded-lg bg-[#00ff00]/10">
                                        <div className="text-[#00ff00]/70 mb-1">TOTAL SOLD</div>
                                        <div className="text-xl text-[#00ff00] font-mono">${pnlData?.totalSold.toFixed(2)}</div>
                                    </div>

                                    {/* Realized P&L Box */}
                                    <div className="border-2 border-[#00ff00]/20 p-4 rounded-lg bg-[#00ff00]/10">
                                        <div className="text-[#00ff00]/70 mb-1">REMAINING AMOUNT</div>
                                        <div className="text-xl text-[#00ff00] font-mono">+${(remainingTokenAmount * currentTokenPrice).toFixed(2)}</div>
                                        <div className="text-sm text-[#00ff00]/60 font-mono">
                                            {remainingTokenAmount.toFixed(2)} ${tokenSymbol}
                                        </div>
                                    </div>

                                    {/* Unrealized P&L Box */}
                                    <div className="border-2 border-[#00ff00]/20 p-4 rounded-lg bg-[#00ff00]/10">
                                        <div className="text-[#00ff00]/70 mb-1">TOTAL REWARD</div>
                                        <div className="text-xl text-[#00ff00] font-mono">+${((pnlData?.totalRewards || 0) * currentDistributionTokenPrice).toFixed(2)}</div>
                                        <div className="text-sm text-[#00ff00]/60 font-mono">
                                            {(pnlData?.totalRewards || 0).toFixed(2)} ${distributionTokenSymbol}
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-[#00ff00]/60" />

                                {/* Timestamp */}
                                <div className="text-sm text-[#00ff00]/60 font-mono mt-4">
                                    {new Date().toLocaleString('en-US', {
                                        timeZone: 'UTC',
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false
                                    })} UTC
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={handleCopyImage}
                                className="flex-1 terminal-button px-4 py-2 flex items-center justify-center gap-2"
                            >
                                <Copy size={16} />
                                {copySuccess ? 'Copied!' : 'Copy Image'}
                            </button>
                            <button
                                onClick={handleDownloadImage}
                                className="flex-1 terminal-button px-4 py-2 flex items-center justify-center gap-2"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 