import * as React from 'react';

interface WalletLinkProps {
    href: string;
    imageSrc: string;
    altText: string;
    walletName: string;
}

export const WalletLink: React.FC<WalletLinkProps> = ({ href, imageSrc, altText, walletName }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center p-4 border border-[#00ff00]/20 rounded hover:bg-[#00ff00]/5 transition-colors"
    >
        <img
            src={imageSrc}
            alt={altText}
            className="w-12 h-12 mb-4"
        />
        <span className="terminal-header text-[#00ff00] uppercase text-sm">INSTALL</span>
        <span className="terminal-header text-[#00ff00] uppercase text-sm">{walletName}</span>
    </a>
); 