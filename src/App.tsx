import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateCoinPage from './pages/CreateCoinPage';
import TokenProfilePage from './pages/TokenProfilePage';
import HowItWorksPage from './pages/HowItWorksPage';
import GlitchVisionPage from './pages/GlitchVisionPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import { TokenProvider } from './context/TokenContext';
import { SearchProvider } from './context/SearchContext';
import { WalletButton } from './components/WalletButton';
import { SearchBar } from './components/SearchBar';
import { ArrowUpRight } from 'lucide-react';
import { WalletContextProvider } from './context/WalletContext';
import { TosCheck } from './components/TosCheck';
import { DisclaimerPopup } from './components/DisclaimerPopup';

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('disclaimerAccepted');
    if (!hasAccepted) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
  };

  return (
    <WalletContextProvider>
      <TokenProvider>
        <SearchProvider>
          <Router>
            <div className="terminal-bg min-h-screen">
              <div className="w-full px-2 sm:px-4 lg:px-8">
                {/* Header */}
                <div className="h-[120px] sm:h-[140px] flex flex-col justify-between py-4">
                  {/* Top Row: Logo, Links, and Wallet */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Link to="/" className="glitch-text text-xl sm:text-2xl">moneyglitch.fun</Link>
                      <div className="hidden sm:flex items-center gap-2">
                        <Link
                          to="/glitch-vision"
                          className="terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5"
                        >
                          GLITCH_VISION
                          <ArrowUpRight size={14} className="text-[#00ff00]" />
                        </Link>
                        <Link
                          to="/how-it-works"
                          className="terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5"
                        >
                          HOW_IT_WORKS
                          <ArrowUpRight size={14} className="text-[#00ff00]" />
                        </Link>
                      </div>
                    </div>
                    <WalletButton />
                  </div>

                  {/* Bottom Row: Search Bar */}
                  <div className="mt-4">
                    <SearchBar />
                  </div>
                </div>

                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/create" element={
                    <>
                      <TosCheck />
                      <CreateCoinPage />
                    </>
                  } />
                  <Route path="/token/:tokenId" element={
                    <>
                      <TosCheck />
                      <TokenProfilePage />
                    </>
                  } />
                  <Route path="/how-it-works" element={
                    <>
                      <TosCheck />
                      <HowItWorksPage />
                    </>
                  } />
                  <Route path="/glitch-vision" element={
                    <>
                      <TosCheck />
                      <GlitchVisionPage />
                    </>
                  } />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                </Routes>
              </div>
            </div>
            {showDisclaimer && (
              <DisclaimerPopup onAccept={handleAcceptDisclaimer} />
            )}
          </Router>
        </SearchProvider>
      </TokenProvider>
    </WalletContextProvider>
  );
}

export default App;