import { Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';

export function WalletButton() {
  const { connected, connecting, publicKey, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (wallet?.adapter.name !== 'Phantom' && connected) {
      wallet?.adapter.disconnect();
    }
  }, [wallet, connected]);

  const handleClick = () => {
    if (!connected) {
      setVisible(true);
    } else {
      wallet?.adapter.disconnect();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      className={`terminal-button px-4 py-2 flex items-center gap-2 ${connecting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
    >
      <Wallet size={16} className={connecting ? 'animate-pulse' : ''} />
      {connecting ? (
        'Connecting...'
      ) : connected && wallet?.adapter.name === 'Phantom' ? (
        `${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}`
      ) : (
        'Connect Phantom'
      )}
    </button>
  );
}