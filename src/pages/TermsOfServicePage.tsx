import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="terminal-button px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>&gt; RETURN_HOME</span>
        </Link>
      </div>

      <div className="terminal-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={24} className="text-[#00ff00]" />
          <h1 className="terminal-header text-2xl">&gt; TERMS_OF_SERVICE</h1>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <div className="opacity-70 text-xs">Effective Date: March 16, 2025</div>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 1. Acceptance of Terms</h2>
            <p>
              By accessing or using MoneyGlitch.fun ("the Platform"), you agree to comply with these Terms and Conditions. These Terms constitute a legally binding agreement between you and MoneyGlitch.fun. If you do not agree with any part of these Terms, you must not use the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 2. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old to use MoneyGlitch.fun.</li>
              <li>You are responsible for ensuring that your use of the Platform complies with all applicable laws and regulations in your jurisdiction.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 3. Use of the Platform</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MoneyGlitch.fun provides a decentralized platform where users can launch tokens for free and take advantage of Solana's Token2022 technology.</li>
              <li>Users may implement programmable token mechanics such as transaction taxes, reward distributions, and other smart contract functionalities.</li>
              <li>MoneyGlitch.fun does not endorse, audit, or take responsibility for any tokens created or traded on the Platform.</li>
              <li>Users acknowledge and accept the risks associated with decentralized finance (DeFi), including but not limited to smart contract vulnerabilities, market volatility, and potential loss of funds.</li>
              <li>The Platform is provided on an "as-is" basis, and all financial decisions made by users are at their own risk.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 4. Prohibited Activities</h2>
            <p>Users may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Platform for illegal or fraudulent activities.</li>
              <li>Deploy or promote tokens that violate laws, encourage illicit activity, or mislead investors.</li>
              <li>Exploit vulnerabilities, attempt to hack, manipulate, or disrupt the Platform in any way.</li>
              <li>Use bots or automated scripts that negatively impact the fairness and integrity of the Platform.</li>
              <li>Engage in any activity that would cause MoneyGlitch.fun to be liable for regulatory violations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 5. Fees and Transactions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MoneyGlitch.fun allows free token launches but may impose fees on certain transactions, features, or smart contract interactions.</li>
              <li>Users are responsible for all blockchain-related transaction fees, including network gas fees.</li>
              <li>Any taxes, financial regulations, or legal obligations arising from token creation, trading, or distributions are the sole responsibility of the user.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 6. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MoneyGlitch.fun and its associated brand, logos, and platform technology are protected under applicable intellectual property laws.</li>
              <li>Users retain ownership of the tokens they create but acknowledge that they are responsible for any legal implications related to their projects.</li>
              <li>Users may not copy, distribute, or reproduce the Platform's proprietary software or services without explicit permission.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 7. Disclaimers and Limitations of Liability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MoneyGlitch.fun provides its services "as is" and "as available" without any warranties of any kind, express or implied.</li>
              <li>MoneyGlitch.fun does not guarantee the security, reliability, or uninterrupted operation of the Platform.</li>
              <li>The Platform is not responsible for any financial losses, smart contract failures, or user errors.</li>
              <li>MoneyGlitch.fun is not liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of funds, lost profits, or loss of data arising from the use of the Platform.</li>
              <li>MoneyGlitch.fun does not provide investment, legal, or tax advice.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 8. Indemnification</h2>
            <p>By using MoneyGlitch.fun, you agree to indemnify, defend, and hold harmless the Platform, its developers, affiliates, partners, and service providers from any claims, damages, losses, or expenses arising from:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Platform.</li>
              <li>Your token launches or any financial transactions.</li>
              <li>Any legal action taken by third parties related to your activities on the Platform.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 9. No Class Action</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users agree that any disputes with MoneyGlitch.fun must be resolved on an individual basis.</li>
              <li>You waive any rights to participate in class action lawsuits, class-wide arbitration, or any other representative legal action against MoneyGlitch.fun or its operators.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 10. Termination of Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MoneyGlitch.fun reserves the right to suspend, restrict, or terminate access to the Platform for any user who violates these Terms.</li>
              <li>The Platform may also discontinue services at its sole discretion without prior notice.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 11. Governing Law and Jurisdiction</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>These Terms and Conditions are governed by and construed under the laws of the applicable jurisdiction where MoneyGlitch.fun operates.</li>
              <li>Any legal disputes arising from the use of the Platform shall be resolved in the designated jurisdiction of MoneyGlitch.fun.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 12. Updates and Changes</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MoneyGlitch.fun reserves the right to update these Terms at any time.</li>
              <li>Continued use of the Platform after updates constitutes acceptance of the revised Terms.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 13. Contact Us</h2>
            <p>If you have any questions or concerns about these Terms, please contact us via Telegram at <a href="https://t.me/moneyglitchfun" target="_blank" rel="noopener noreferrer" className="text-[#00ff00] hover:underline">t.me/moneyglitchfun</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsOfServicePage;