import { AlertTriangle, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DisclaimerPopupProps {
  onAccept: () => void;
}

export function DisclaimerPopup({ onAccept }: DisclaimerPopupProps) {
  const location = useLocation();

  // Don't show the popup on privacy policy or terms pages
  if (location.pathname === '/privacy-policy' || location.pathname === '/terms-of-service') {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[100] p-4">
      <div className="bg-black/80 backdrop-blur-md border border-[#00ff00]/30 rounded-lg p-6 max-w-xl w-full relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Zap size={24} className="text-[#00ff00]" />
          <span
            className="text-xl font-bold tracking-[2px] uppercase text-[#00ff00]"
            style={{
              fontFamily: 'Source Code Pro, monospace',
              textShadow: '0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5), 0 0 15px rgba(0, 255, 0, 0.3)'
            }}
          >
            moneyglitch.fun
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={20} className="text-[#00ff00]" />
          <h2 className="text-lg">&gt; Welcome</h2>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-base leading-relaxed">
            moneyglitch.fun allows <span className="text-[#00ff00]">anyone</span> to create tokens. all tokens created on moneyglitch are <span className="text-[#00ff00]">fair-launch</span>, meaning everyone has equal access to buy and sell when the token is first created.
          </p>

          <div className="space-y-2 pl-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#00ff00]">step 1:</span>
              <span>pick a token that you like</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#00ff00]">step 2:</span>
              <span>configure your tax and distribution settings</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#00ff00]">step 3:</span>
              <span>sell at any time to lock in your profits or losses</span>
            </div>
          </div>

          <div className="bg-black/40 rounded p-3 border border-[#00ff00]/20">
            <p className="text-xs opacity-80">
              by clicking this button you agree to the terms and conditions and certify that you are over 18
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onAccept}
            className="terminal-button w-full py-3 flex items-center justify-center gap-2 text-base hover:bg-[#00ff00]/10 transition-all duration-200"
          >
            <span>&gt; I'M_READY_TO_GLITCH</span>
          </button>

          <div className="flex items-center justify-center gap-3 text-xs opacity-70">
            <Link
              to="/privacy-policy"
              className="hover:text-[#00ff00] transition-colors"
            >
              privacy policy
            </Link>
            <span>|</span>
            <Link
              to="/terms-of-service"
              className="hover:text-[#00ff00] transition-colors"
            >
              terms of service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}