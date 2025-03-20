import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronDown, Gift, Users, LogOut } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsOpen(false);
  };

  // Format public key to show abbreviated version
  const formatPublicKey = (publicKey: string) => {
    return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
  };

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="terminal-button px-4 py-2 flex items-center gap-2"
      >
        <Wallet size={16} />
        [CONNECT]
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="terminal-button px-4 py-2 flex items-center gap-2"
      >
        <Wallet size={16} />
        <span className="font-mono">{publicKey ? formatPublicKey(publicKey.toString()) : ''}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black border border-[#00ff00]/30 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={() => {
                navigate('/points');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[#00ff00]/10 transition-colors"
            >
              <Gift size={16} className="text-[#00ff00]" />
              <span>Points</span>
            </button>

            <button
              onClick={() => {
                navigate('/referral');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[#00ff00]/10 transition-colors"
            >
              <Users size={16} className="text-[#00ff00]" />
              <span>Referrals</span>
            </button>

            <div className="border-t border-[#00ff00]/20 my-1"></div>

            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[#00ff00]/10 transition-colors text-red-400"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}