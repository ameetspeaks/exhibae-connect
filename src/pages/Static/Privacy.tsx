export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <div className="space-y-4 text-gray-600">
            <h3 className="text-xl font-medium">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and contact information</li>
              <li>Email address and phone number</li>
              <li>Company details and business information</li>
              <li>Payment information</li>
            </ul>

            <h3 className="text-xl font-medium">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Log data and device information</li>
              <li>IP address and browser type</li>
              <li>Pages visited and features used</li>
              <li>Time spent on the platform</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>To provide and improve our services</li>
            <li>To process transactions and payments</li>
            <li>To communicate with you about exhibitions and updates</li>
            <li>To analyze platform usage and enhance user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="text-gray-600 mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Exhibition organizers for stall bookings</li>
            <li>Payment processors for transactions</li>
            <li>Service providers who assist in platform operations</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-gray-600 mb-4">
            We implement appropriate security measures to protect your information:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Encryption of sensitive data</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
            <li>Secure data storage and transmission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p className="text-gray-600 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="text-gray-600 mb-4">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Remember your preferences</li>
            <li>Analyze platform usage</li>
            <li>Provide personalized content</li>
            <li>Improve user experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
          <p className="text-gray-600 mb-4">
            Our services are not intended for users under 18 years of age. We do not knowingly collect 
            information from children under 18.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Changes to Privacy Policy</h2>
          <p className="text-gray-600 mb-4">
            We may update this privacy policy periodically. We will notify you of any significant changes 
            through email or platform notifications.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p className="text-gray-600">
            If you have questions about this Privacy Policy, please contact our Data Protection Officer at:
            <br />
            Email: privacy@exhibae.com
            <br />
            Address: ExhiBae Technologies, Mumbai, India
          </p>
        </section>
      </div>
    </div>
  );
} 