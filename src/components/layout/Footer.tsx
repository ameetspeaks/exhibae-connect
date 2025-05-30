import React from 'react';
import { Link } from 'react-router-dom';
import { ExhibaeLogo } from '@/components/ui/ExhibaeLogo';
import { Facebook, Instagram } from 'lucide-react';

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
                <a href="https://www.instagram.com/exhibae/" target="_blank" rel="noopener noreferrer" className="text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.threads.com/@exhibae" target="_blank" rel="noopener noreferrer" className="text-[#4B1E25]/80 hover:text-[#4B1E25]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V11.5l.007-.463c.06-3.618 1.398-6.297 3.972-7.951 2.077-1.33 4.079-1.996 5.993-1.996h.122c1.739.022 3.171.477 4.243 1.348.357.289.572.37.922.419-.213-.646-.472-1.34-.789-2.085-.237-.557.075-1.203.666-1.379.581-.175 1.179.137 1.358.705.868 2.749 1.322 4.846 1.438 6.639.045.68-.419 1.285-1.085 1.285-.667 0-1.083-.604-1.109-1.285-.116-3.03-.843-4.673-1.796-5.523-.692-.619-1.624-.919-2.777-.919-1.57 0-3.282.574-5.092 1.708-1.904 1.222-2.961 3.337-3.012 6.359l-.007.422v.516c0 3.105.74 5.575 2.14 7.132 1.401 1.556 3.586 2.524 6.522 2.524 2.936 0 5.12-.968 6.522-2.524 1.4-1.557 2.14-4.027 2.14-7.132 0-.663.546-1.201 1.219-1.201s1.219.537 1.219 1.201c0 3.518-.85 6.372-2.495 8.423-1.85 2.305-4.603 3.486-8.184 3.509h-.007z"/>
                  </svg>
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
