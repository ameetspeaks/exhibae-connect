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
                <a href="https://www.instagram.com/exhibae/" target="_blank" rel="noopener noreferrer" className="text-[#4B1E25]/80 hover:text-[#4B1E25] transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.threads.com/@exhibae" target="_blank" rel="noopener noreferrer" className="text-[#4B1E25]/80 hover:text-[#4B1E25] transition-colors">
                  <svg className="h-5 w-5" viewBox="0 0 192 192" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/>
                  </svg>
                </a>
                <a href="https://www.facebook.com/exhibae" target="_blank" rel="noopener noreferrer" className="text-[#4B1E25]/80 hover:text-[#4B1E25] transition-colors">
                  <Facebook className="h-5 w-5" />
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
