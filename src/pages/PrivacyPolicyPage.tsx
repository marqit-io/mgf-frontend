import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

function PrivacyPolicyPage() {
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
          <Shield size={24} className="text-[#00ff00]" />
          <h1 className="terminal-header text-2xl">&gt; PRIVACY_POLICY</h1>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <div className="opacity-70 text-xs">Effective Date: March 16, 2025</div>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 1. Introduction</h2>
            <p>
              MoneyGlitch.fun ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our platform, which enables users to launch tokens utilizing Solana's Token2022 technology. By accessing or using MoneyGlitch.fun, you agree to the terms of this Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 2. Information We Collect</h2>
            <p>We may collect both personal and non-personal information about you:</p>
            <div className="pl-4 space-y-2">
              <p><span className="text-[#00ff00]">Personal Information:</span> Information that identifies you personally, such as your name, email address, wallet address, and any other information you voluntarily provide to us.</p>
              <p><span className="text-[#00ff00]">Non-Personal Information:</span> Information that does not identify you personally, including but not limited to your browser type, operating system, device information, and usage data.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 3. How We Collect Information</h2>
            <p>We collect information in the following ways:</p>
            <div className="pl-4 space-y-2">
              <p><span className="text-[#00ff00]">Directly from You:</span> When you register on our platform, create or manage tokens, or communicate with us.</p>
              <p><span className="text-[#00ff00]">Automatically:</span> Through cookies, log files, and similar technologies when you interact with our platform. This may include your IP address, browser type, access times, and pages viewed.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 4. Use of Your Information</h2>
            <p>We may use the information we collect for various purposes, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To Provide and Maintain Our Services: Ensuring the functionality and security of our platform.</li>
              <li>To Improve Our Platform: Analyzing usage patterns to enhance user experience.</li>
              <li>To Communicate with You: Responding to your inquiries, providing updates, and sending promotional materials (with your consent).</li>
              <li>To Comply with Legal Obligations: Ensuring adherence to applicable laws and regulations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 5. Sharing Your Information</h2>
            <p>We do not sell or rent your personal information to third parties. We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With Service Providers: Third-party vendors who assist us in operating our platform and providing services to you, bound by confidentiality agreements.</li>
              <li>For Legal Reasons: If required by law or in response to valid requests by public authorities.</li>
              <li>Business Transfers: In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 6. Security of Your Information</h2>
            <p>We implement reasonable security measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is 100% secure.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 7. Your Choices</h2>
            <p>You have the following rights regarding your information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and Update: You can access and update your personal information through your account settings.</li>
              <li>Opt-Out: You may opt out of receiving promotional communications from us by following the unsubscribe instructions in those communications.</li>
              <li>Cookies: You can set your browser to refuse cookies or alert you when cookies are being sent. However, some parts of our platform may not function properly without cookies.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 8. Third-Party Links</h2>
            <p>Our platform may contain links to third-party websites. We are not responsible for the privacy practices or content of these sites. We encourage you to review the privacy policies of any third-party sites you visit.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 9. Children's Privacy</h2>
            <p>Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have inadvertently received personal information from a user under the age of 18, we will delete such information from our records.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 10. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date." Your continued use of the platform after any changes constitutes your acceptance of the new Privacy Policy.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg text-[#00ff00]">&gt; 11. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us via Telegram at <a href="https://t.me/moneyglitchfun" target="_blank" rel="noopener noreferrer" className="text-[#00ff00] hover:underline">t.me/moneyglitchfun</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;