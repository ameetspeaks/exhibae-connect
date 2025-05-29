import React from 'react';
import { Link } from 'react-router-dom';
import { ExhibaeLogo } from '@/components/ui/ExhibaeLogo';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#E6C5B6] text-[#1C1C1C] border-t border-[#4B1E25]/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Logo and Description Column */}
          <div className="md:col-span-6">
            <div className="flex items-center gap-2">
              <div className="w-[120px] flex-shrink-0">
                <ExhibaeLogo variant="footer" className="h-12" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4B1E25] mb-0.5">Exhibae</h2>
                <p className="text-sm text-[#4B1E25]/80">
                  Discover and participate in the most exciting exhibitions. Connect with brands, organizers, and fellow enthusiasts.
                </p>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[#4B1E25]">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4B1E25]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/exhibitions" className="text-sm text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  Exhibitions
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-sm text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  Brands
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4B1E25]">Solutions</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/for-organizers" className="text-sm text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  For Organizers
                </Link>
              </li>
              <li>
                <Link to="/for-brands" className="text-sm text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  For Brands
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#4B1E25]/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[#4B1E25]/60">
              © {currentYear} Exhibae. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-[#4B1E25]/60 hover:text-[#4B1E25]">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-[#4B1E25]/60 hover:text-[#4B1E25]">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
