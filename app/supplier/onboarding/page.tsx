/**
 * Supplier Onboarding Wizard
 * Multi-step verification and setup process
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FileText, CreditCard, CheckCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';

type OnboardingStep = 'business' | 'verification' | 'payment' | 'review';

interface BusinessInfo {
  businessName: string;
  businessType: 'individual' | 'company' | 'partnership';
  taxId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  website: string;
}

interface VerificationDocs {
  identityDoc?: File;
  businessDoc?: File;
  taxDoc?: File;
}

export default function SupplierOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('business');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    businessType: 'individual',
    taxId: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    website: '',
  });
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocs>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps: { id: OnboardingStep; title: string; icon: any }[] = [
    { id: 'business', title: 'Business Info', icon: Building2 },
    { id: 'verification', title: 'Verification', icon: FileText },
    { id: 'payment', title: 'Payment Setup', icon: CreditCard },
    { id: 'review', title: 'Review', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleFileUpload = (field: keyof VerificationDocs, file: File) => {
    setVerificationDocs(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Submit to API
      const response = await fetch('/api/supplier/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessInfo,
          agreedToTerms,
          // Files would be uploaded separately via FormData
        }),
      });

      if (response.ok) {
        router.push('/supplier/onboarding/pending');
      } else {
        alert('Onboarding submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Become a Supplier</h1>
          <p className="text-gray-600">Complete your profile to start selling</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <div className="text-sm font-medium mt-2 text-center">{step.title}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Business Info Step */}
          {currentStep === 'business' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessInfo.businessName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    value={businessInfo.businessType}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, businessType: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="individual">Individual/Sole Proprietor</option>
                    <option value="company">Company/Corporation</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID / EIN *
                    </label>
                    <input
                      type="text"
                      value={businessInfo.taxId}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, taxId: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="XX-XXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={businessInfo.city}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={businessInfo.state}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP *</label>
                    <input
                      type="text"
                      value={businessInfo.zip}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, zip: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Verification Step */}
          {currentStep === 'verification' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Identity Verification</h2>
              <p className="text-gray-600 mb-6">
                Upload the following documents to verify your identity and business. All documents are encrypted and secure.
              </p>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Government-Issued ID *</h3>
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Driver's license, passport, or national ID</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('identityDoc', e.target.files[0])}
                    className="w-full"
                  />
                  {verificationDocs.identityDoc && (
                    <p className="text-sm text-green-600 mt-2">✓ {verificationDocs.identityDoc.name}</p>
                  )}
                </div>

                {businessInfo.businessType !== 'individual' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Business Registration *</h3>
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Articles of incorporation, business license, or registration certificate
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('businessDoc', e.target.files[0])}
                      className="w-full"
                    />
                    {verificationDocs.businessDoc && (
                      <p className="text-sm text-green-600 mt-2">✓ {verificationDocs.businessDoc.name}</p>
                    )}
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Tax Document (Optional)</h3>
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">W-9 or equivalent tax form</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('taxDoc', e.target.files[0])}
                    className="w-full"
                  />
                  {verificationDocs.taxDoc && (
                    <p className="text-sm text-green-600 mt-2">✓ {verificationDocs.taxDoc.name}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Why we need this:</strong> We're required to verify all suppliers to prevent fraud and ensure a safe marketplace. Your documents are encrypted and only visible to our verification team.
                </p>
              </div>
            </div>
          )}

          {/* Payment Setup Step */}
          {currentStep === 'payment' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Setup</h2>
              <p className="text-gray-600 mb-6">
                Connect your bank account to receive payouts. We use Stripe Connect for secure payment processing.
              </p>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-8 text-center mb-6">
                <CreditCard className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Stripe Connect</h3>
                <p className="text-gray-600 mb-6">
                  You'll be redirected to Stripe to securely connect your bank account. This takes about 5 minutes.
                </p>
                <button
                  onClick={() => {
                    // In production, redirect to Stripe Connect OAuth
                    alert('Redirecting to Stripe Connect... (not implemented in demo)');
                  }}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Connect with Stripe
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Payment Terms</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Payouts processed weekly on Fridays</li>
                  <li>Platform fee: 5% per transaction</li>
                  <li>Payment processing fee: 2.9% + $0.30 (Stripe standard)</li>
                  <li>Minimum payout: $25</li>
                  <li>Funds available 2 business days after order delivery</li>
                </ul>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-600">Business Name</dt>
                      <dd className="font-medium text-gray-900">{businessInfo.businessName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Business Type</dt>
                      <dd className="font-medium text-gray-900">{businessInfo.businessType}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Tax ID</dt>
                      <dd className="font-medium text-gray-900">{businessInfo.taxId}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Phone</dt>
                      <dd className="font-medium text-gray-900">{businessInfo.phone}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Verification Documents</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span>Government ID: {verificationDocs.identityDoc?.name || 'Not uploaded'}</span>
                    </li>
                    {businessInfo.businessType !== 'individual' && (
                      <li className="flex items-center text-sm">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span>Business Registration: {verificationDocs.businessDoc?.name || 'Not uploaded'}</span>
                      </li>
                    )}
                    {verificationDocs.taxDoc && (
                      <li className="flex items-center text-sm">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span>Tax Document: {verificationDocs.taxDoc.name}</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      I agree to the{' '}
                      <a href="/supplier-agreement" target="_blank" className="text-purple-600 font-semibold hover:underline">
                        Supplier Agreement
                      </a>
                      , including the terms of service, payment terms, and content guidelines. I confirm that all information provided is accurate and complete.
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>What happens next?</strong> Your application will be reviewed within 1-2 business days. You'll receive an email once approved. If we need additional information, we'll reach out directly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={!agreedToTerms || submitting}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
