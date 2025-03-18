import { useState, useRef, useEffect } from 'react';
import { Download, Copy, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useWallet } from '@solana/wallet-adapter-react';

interface PnlCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenSymbol: string;
    tokenAddress: string;
    currentPrice: number;
}

interface PnlData {
    totalInvested: number;
    currentValue: number;
    realizedPnl: number;
    unrealizedPnl: number;
    percentageReturn: number;
}

export function PnlCalculatorModal({ isOpen, onClose, tokenSymbol, tokenAddress, currentPrice }: PnlCalculatorModalProps) {
    const { publicKey } = useWallet();
    const [pnlData, setPnlData] = useState<PnlData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const pnlCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && publicKey) {
            // Mock data generation
            setTimeout(() => {
                const mockPnlData: PnlData = {
                    totalInvested: 1000,
                    currentValue: 1500,
                    realizedPnl: 200,
                    unrealizedPnl: 300,
                    percentageReturn: 50
                };
                setPnlData(mockPnlData);
                setIsLoading(false);
            }, 1000); // Simulate loading delay
        }
    }, [isOpen, publicKey]);

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/90 border border-[#00ff00]/20 rounded-lg p-6 max-w-lg w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#00ff00]">PNL Calculator</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse text-[#00ff00]">Loading PNL data...</div>
                    </div>
                ) : (
                    <>
                        <div ref={pnlCardRef} className="bg-black border border-[#00ff00]/30 rounded-lg p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[#00ff00] text-lg">{tokenSymbol} PNL</span>
                                <img src="/moneyglitch-logo.png" alt="MoneyGlitch" className="h-8" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Total Invested</span>
                                    <span className="text-white">${pnlData?.totalInvested.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Current Value</span>
                                    <span className="text-white">${pnlData?.currentValue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Realized PNL</span>
                                    <span className={pnlData && pnlData.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        ${pnlData?.realizedPnl?.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Unrealized PNL</span>
                                    <span className={pnlData && pnlData.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        ${pnlData?.unrealizedPnl?.toFixed(2)}
                                    </span>
                                </div>
                                <div className="border-t border-[#00ff00]/20 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-[#00ff00]">Total Return</span>
                                        <span className={pnlData && pnlData.percentageReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {pnlData?.percentageReturn?.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
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