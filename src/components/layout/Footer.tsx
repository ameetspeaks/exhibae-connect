import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-exhibae-navy text-white py-12 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Exhi<span className="text-exhibae-coral">Bae</span></h3>
            <p className="text-gray-300 mb-4">
              Connecting Exhibition Organizers, Brands, and Shoppers in one seamless platform.
            </p>
            <div className="space-y-2">
              <Link to="/about" className="block text-gray-300 hover:text-exhibae-coral">About Us</Link>
              <Link to="/contact" className="block text-gray-300 hover:text-exhibae-coral">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Organizers</h4>
            <ul className="space-y-2">
              <li><Link to="/for-organizers" className="text-gray-300 hover:text-exhibae-coral">Create Exhibition</Link></li>
              <li><Link to="/for-organizers" className="text-gray-300 hover:text-exhibae-coral">Manage Stalls</Link></li>
              <li><Link to="/for-organizers" className="text-gray-300 hover:text-exhibae-coral">Analytics</Link></li>
              <li><Link to="/auth/register" className="text-gray-300 hover:text-exhibae-coral">Register as Organizer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Brands</h4>
            <ul className="space-y-2">
              <li><Link to="/for-brands" className="text-gray-300 hover:text-exhibae-coral">Find Exhibitions</Link></li>
              <li><Link to="/for-brands" className="text-gray-300 hover:text-exhibae-coral">Apply for Stalls</Link></li>
              <li><Link to="/for-brands" className="text-gray-300 hover:text-exhibae-coral">Brand Analytics</Link></li>
              <li><Link to="/auth/register" className="text-gray-300 hover:text-exhibae-coral">Register as Brand</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/exhibitions" className="text-gray-300 hover:text-exhibae-coral">All Exhibitions</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-exhibae-coral">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-gray-300 hover:text-exhibae-coral">Privacy Policy</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-exhibae-coral">Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300">© 2025 ExhiBae. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/terms" className="text-gray-300 hover:text-white">Terms</Link>
            <Link to="/privacy" className="text-gray-300 hover:text-white">Privacy</Link>
            <Link to="/contact" className="text-gray-300 hover:text-white">Contact</Link>
            <Link to="/about" className="text-gray-300 hover:text-white">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
