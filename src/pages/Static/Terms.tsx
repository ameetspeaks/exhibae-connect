export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-4">
            By accessing and using ExhiBae's platform, you agree to be bound by these Terms and Conditions. 
            If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Users must provide accurate and complete information when creating an account</li>
            <li>Users are responsible for maintaining the confidentiality of their account credentials</li>
            <li>Users must notify ExhiBae immediately of any unauthorized use of their account</li>
            <li>ExhiBae reserves the right to suspend or terminate accounts that violate these terms</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Exhibition Listings</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Organizers must provide accurate information about their exhibitions</li>
            <li>All listed exhibitions must comply with local laws and regulations</li>
            <li>ExhiBae reserves the right to remove any exhibition listings that violate our policies</li>
            <li>Pricing and availability of stalls are subject to change</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Payments and Refunds</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>All payments must be made through our secure payment system</li>
            <li>Refunds are subject to the organizer's cancellation policy</li>
            <li>Processing fees are non-refundable</li>
            <li>Disputes must be raised within 30 days of the transaction</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
          <p className="text-gray-600 mb-4">
            All content on the ExhiBae platform, including but not limited to text, graphics, logos, and software, 
            is the property of ExhiBae and protected by intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <p className="text-gray-600 mb-4">
            ExhiBae is not liable for any direct, indirect, incidental, special, or consequential damages 
            arising from the use of our services or any transactions between users.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
          <p className="text-gray-600 mb-4">
            ExhiBae reserves the right to modify these terms at any time. Users will be notified of significant changes, 
            and continued use of the platform constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
          <p className="text-gray-600 mb-4">
            These terms are governed by and construed in accordance with the laws of India. 
            Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
          <p className="text-gray-600">
            For any questions about these Terms and Conditions, please contact us at legal@exhibae.com
          </p>
        </section>
      </div>
    </div>
  );
} 