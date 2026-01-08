export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 5, 2026</p>
        
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              AI-Native Mall ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our Service. Please read this policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
                  <li>Name and email address</li>
                  <li>Account credentials (encrypted passwords)</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Phone number (optional)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Usage Data</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
                  <li>Browsing history and interaction patterns</li>
                  <li>Search queries and product preferences</li>
                  <li>Purchase history and transaction details</li>
                  <li>Device information (browser, OS, IP address)</li>
                  <li>Location data (with your permission)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Consciousness & Emotional Data</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
                  <li>Emotional states you share with AI curators</li>
                  <li>Interaction history with AI assistants</li>
                  <li>Transformation journey milestones</li>
                  <li>Healing circle participation (with your consent)</li>
                  <li>Ritual practice records (optional)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
              <li>Process and fulfill your orders</li>
              <li>Provide personalized recommendations through AI</li>
              <li>Improve our Service and user experience</li>
              <li>Communicate with you about orders, updates, and promotions</li>
              <li>Detect and prevent fraud or security issues</li>
              <li>Analyze usage patterns and trends</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. AI and Machine Learning</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Our AI systems use your data to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
              <li>Generate personalized product recommendations</li>
              <li>Understand your emotional context for better curation</li>
              <li>Suggest healing circles and transformation paths</li>
              <li>Improve curator responses and interactions</li>
              <li>Train and enhance our AI models</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              You can opt-out of consciousness tracking and AI-enhanced features at any time in your 
              account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Information Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
              <li><strong>Service Providers:</strong> Payment processors (Stripe), hosting providers, analytics services</li>
              <li><strong>Creators/Vendors:</strong> Necessary order information to fulfill purchases</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3 font-semibold">
              We never sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Data Security</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Secure authentication with hashed passwords</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access to personal information</li>
              <li>PCI DSS compliance for payment processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Your Privacy Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correct:</strong> Update inaccurate or incomplete information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restrict:</strong> Limit how we process your data</li>
              <li><strong>Object:</strong> Object to certain data processing activities</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              To exercise these rights, contact us at privacy@ai-mall.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
              <li>Maintain your session and preferences</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Personalize your experience</li>
              <li>Serve relevant advertisements</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              You can control cookies through your browser settings. Note that disabling cookies may 
              affect site functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
              <li><strong>Stripe:</strong> Payment processing (PCI compliant)</li>
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Google Analytics:</strong> Usage analytics (optional)</li>
              <li><strong>OpenAI:</strong> AI-powered features</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              These services have their own privacy policies, which we encourage you to review.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as necessary to provide our Service and comply with legal 
              obligations. When you delete your account, we will remove or anonymize your personal 
              information within 90 days, except where we're required to retain it by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a 
              child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. International Users</h2>
            <p className="text-gray-600 leading-relaxed">
              Your information may be transferred to and processed in the United States or other countries 
              where our service providers operate. By using our Service, you consent to such transfers. 
              We comply with applicable data protection laws, including GDPR and CCPA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Changes to Privacy Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes via email or a notice on our Service. Your continued use after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">14. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700"><strong>Email:</strong> privacy@ai-mall.com</p>
              <p className="text-gray-700"><strong>Address:</strong> 123 Innovation Drive, San Francisco, CA 94103</p>
              <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@ai-mall.com</p>
            </div>
          </section>

          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              By using AI-Native Mall, you acknowledge that you have read and understood this Privacy Policy 
              and consent to the collection and use of your information as described.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
