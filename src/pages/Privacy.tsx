import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-exhibae-navy text-center mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">1. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-8 text-gray-600">
              <li>Name and contact information</li>
              <li>Account credentials</li>
              <li>Payment information</li>
              <li>Exhibition and business details</li>
              <li>Communication preferences</li>
            </ul>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-8 text-gray-600">
              <li>Provide and maintain our services</li>
              <li>Process your transactions</li>
              <li>Send you important updates and notifications</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">3. Information Sharing</h2>
            <p className="text-gray-600 mb-8">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 mb-8 text-gray-600">
              <li>Service providers who assist in our operations</li>
              <li>Exhibition organizers for booking purposes</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">4. Data Security</h2>
            <p className="text-gray-600 mb-8">
              We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">5. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-8 text-gray-600">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
            </ul>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">6. Cookies and Tracking</h2>
            <p className="text-gray-600 mb-8">
              We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">7. Children's Privacy</h2>
            <p className="text-gray-600 mb-8">
              Our services are not intended for children under 13. We do not knowingly collect information from children under 13.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">8. Changes to Privacy Policy</h2>
            <p className="text-gray-600 mb-8">
              We may update this privacy policy periodically. We will notify you of any material changes via email or through the platform.
            </p>

            <h2 className="text-2xl font-bold text-exhibae-navy mb-6">9. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about our Privacy Policy, please contact our Data Protection Officer at:
            </p>
            <p className="text-gray-600">
              Email: privacy@exhibae.com<br />
              Phone: +91 (800) 123-4567<br />
              Address: 123 Exhibition Street, Mumbai, Maharashtra 400001, India
            </p>

            <div className="mt-12 p-6 bg-exhibae-light-gray rounded-lg">
              <h3 className="text-xl font-semibold text-exhibae-navy mb-4">Additional Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-exhibae-coral hover:underline">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-exhibae-coral hover:underline">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy; 