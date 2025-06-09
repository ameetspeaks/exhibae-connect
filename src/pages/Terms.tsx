import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-exhibae-navy text-center mb-6">
            Terms and Conditions
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            Please read these terms carefully before using Exhibae.
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-8">
              By accessing and using Exhibae, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">2. User Accounts</h2>
            <p className="text-gray-600 mb-4">
              To use certain features of the platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-8 text-gray-600">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">3. Exhibition Listings</h2>
            <p className="text-gray-600 mb-8">
              Organizers are responsible for ensuring all exhibition information is accurate and up-to-date. Exhibae reserves the right to remove any listing that violates our policies.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">4. Payments and Refunds</h2>
            <p className="text-gray-600 mb-4">
              All payments are processed securely through our platform. Our refund policy is as follows:
            </p>
            <ul className="list-disc pl-6 mb-8 text-gray-600">
              <li>Cancellations made 30 days before the exhibition: Full refund</li>
              <li>Cancellations made 15-29 days before: 50% refund</li>
              <li>Cancellations made less than 15 days before: No refund</li>
            </ul>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">5. Intellectual Property</h2>
            <p className="text-gray-600 mb-8">
              All content on Exhibae, including but not limited to text, graphics, logos, and software, is the property of Exhibae and protected by intellectual property laws.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">6. Limitation of Liability</h2>
            <p className="text-gray-600 mb-8">
              Exhibae shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">7. Privacy Policy</h2>
            <p className="text-gray-600 mb-4">
              Your use of Exhibae is also governed by our Privacy Policy. Please review our{' '}
              <Link to="/privacy" className="text-exhibae-coral hover:underline">
                Privacy Policy
              </Link>
              {' '}for more information.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">8. Changes to Terms</h2>
            <p className="text-gray-600 mb-8">
              Exhibae reserves the right to modify these terms at any time. We will notify users of any material changes via email or through the platform.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">9. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-600">
              Email: legal@exhibae.com<br />
              Phone: +91 (800) 123-4567<br />
              Address: 123 Exhibition Street, Mumbai, Maharashtra 400001, India
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms; 