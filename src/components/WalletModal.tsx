import { useEffect, useRef, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { WalletLink } from './WalletLink';
import phantomIcon from '../assets/phantom.svg';
import solflareIcon from '../assets/solflare.svg';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { wallets, select } = useWallet();
    const modalRef = useRef<HTMLDivElement>(null);
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Reset explanation state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setIsExplanationOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Filter for installed wallets only
    const readyWallets = useMemo(() =>
        wallets.filter(wallet =>
            wallet.readyState === WalletReadyState.Installed &&
            !wallet.adapter.name.toLowerCase().includes('metamask')
        ),
        [wallets]
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div
                ref={modalRef}
                className="bg-[#001100] border-2 border-[#00ff00]/30 rounded-lg w-[calc(100%-32px)] max-w-[400px] relative mx-4"
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-[#00ff00] hover:text-[#00ff00]/80"
                >
                    <X size={24} />
                </button>

                {readyWallets.length > 0 ? (
                    <>
                        <div className="text-center pt-24">
                            <div className="flex flex-col gap-4 terminal-header text-lg text-[#00ff00]">
                                <div>CONNECT A WALLET ON</div>
                                <div>SOLANA TO CONTINUE</div>
                            </div>
                        </div>
                        <div className="mt-8 p-8">
                            {readyWallets.map((wallet) => (
                                <button
                                    key={wallet.adapter.name}
                                    onClick={() => {
                                        select(wallet.adapter.name);
                                        onClose();
                                    }}
                                    className="w-full p-4 py-6 flex items-center justify-between border-t border-[#00ff00]/20 hover:bg-[#00ff00]/5"
                                >
                                    <div className="flex items-center">
                                        {wallet.adapter.icon && (
                                            <img
                                                src={wallet.adapter.icon}
                                                alt={`${wallet.adapter.name} icon`}
                                                className="w-8 h-8 mr-4"
                                            />
                                        )}
                                        <span className="terminal-header text-[#00ff00] uppercase">
                                            {wallet.adapter.name}
                                        </span>
                                    </div>
                                    <span className="text-sm text-[#00ff00]">
                                        {wallet.readyState === WalletReadyState.Installed ? 'DETECTED' : 'NOT INSTALLED'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center pt-24">
                            <div className="flex flex-col gap-4 terminal-header text-lg text-[#00ff00]">
                                {isMobile ? (
                                    <>
                                        <div>OPEN THIS PAGE</div>
                                        <div>ON WALLET BROWSER</div>
                                    </>
                                ) : (
                                    <>
                                        <div>BROWSER EXTENSION</div>
                                        <div>WALLET REQUIRED</div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="mt-8 p-8">
                            <div className="grid grid-cols-2 gap-4">
                                <WalletLink
                                    href={isMobile ? "https://phantom.app/download" : "https://phantom.app/"}
                                    imageSrc={phantomIcon}
                                    altText="Phantom Wallet"
                                    walletName="PHANTOM"
                                />
                                <WalletLink
                                    href={isMobile ? "https://solflare.com/download" : "https://solflare.com/"}
                                    imageSrc={solflareIcon}
                                    altText="Solflare Wallet"
                                    walletName="SOLFLARE"
                                />
                            </div>
                        </div>
                        <div className="mt-2 mb-4 px-8">
                            <button
                                onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                                className="w-full flex items-center justify-between text-[#00ff00] hover:text-[#00ff00]/80 terminal-header text-sm"
                            >
                                WHY DO I NEED A WALLET?
                                {isExplanationOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {isExplanationOpen && (
                                <div className="mt-2 p-4 border border-[#00ff00]/20 rounded bg-[#001800] text-[#00ff00]/90 text-sm">
                                    <p className="mb-2">A crypto wallet serves as your digital identity and secure storage for your assets on the Solana blockchain. You need it to:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Securely store and manage your digital assets</li>
                                        <li>Connect to decentralized applications (dApps)</li>
                                        <li>Sign transactions and messages</li>
                                        <li>Participate in the Solana ecosystem</li>
                                    </ul>
                                    {isMobile && (
                                        <p className="mt-2 text-[#00ff00]/80">
                                            On mobile devices, you'll need to install a wallet app and use its built-in browser for the best experience.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 