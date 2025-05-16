import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Store, 
  BarChart3, 
  CreditCard,
  Users,
  MessageSquare
} from 'lucide-react';

const ForBrands = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-exhibae-navy mb-6">
              Grow Your Brand with ExhiBae
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Find and book exhibition spaces effortlessly. Connect with organizers and showcase your brand to the right audience.
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-exhibae-navy hover:bg-opacity-90" asChild>
                <Link to="/auth/register">Join Now</Link>
              </Button>
              <Button variant="outline" className="border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white" asChild>
                <Link to="/exhibitions">Browse Exhibitions</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-exhibae-navy text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <Search className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Smart Exhibition Search
              </h3>
              <p className="text-gray-600">
                Find the perfect exhibition opportunities based on your industry, location, and budget.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <Store className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Stall Management
              </h3>
              <p className="text-gray-600">
                Easy-to-use tools for managing your exhibition space, inventory, and staff.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <BarChart3 className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Performance Analytics
              </h3>
              <p className="text-gray-600">
                Track your exhibition performance, visitor engagement, and ROI in real-time.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <CreditCard className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Secure Payments
              </h3>
              <p className="text-gray-600">
                Safe and secure payment processing with flexible payment options.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <Users className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Networking
              </h3>
              <p className="text-gray-600">
                Connect with exhibition organizers and other brands in your industry.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <MessageSquare className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Support
              </h3>
              <p className="text-gray-600">
                24/7 customer support to help you make the most of your exhibition presence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-exhibae-navy text-center mb-12">
            Benefits for Brands
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-exhibae-navy mb-6">
                Simplified Exhibition Process
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Easy application process</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Digital documentation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Automated notifications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Integrated communication</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-exhibae-navy mb-6">
                Growth Opportunities
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Targeted audience reach</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Brand visibility</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Networking opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Market expansion</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-exhibae-navy text-center mb-12">
            Success Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600 mb-6">
                "ExhiBae made it incredibly easy for us to find and book the right exhibitions. Our brand visibility has increased significantly."
              </p>
              <div>
                <p className="font-semibold text-exhibae-navy">Sarah Johnson</p>
                <p className="text-sm text-gray-500">Marketing Director, StyleCo</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600 mb-6">
                "The analytics tools helped us measure our ROI accurately. We've seen a 200% increase in leads from exhibitions."
              </p>
              <div>
                <p className="font-semibold text-exhibae-navy">Michael Chen</p>
                <p className="text-sm text-gray-500">CEO, TechStart</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600 mb-6">
                "The platform's user-friendly interface and excellent support made our exhibition participation smooth and successful."
              </p>
              <div>
                <p className="font-semibold text-exhibae-navy">Priya Patel</p>
                <p className="text-sm text-gray-500">Founder, ArtisanCraft</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-exhibae-navy text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Showcase Your Brand?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of successful brands on ExhiBae and take your business to the next level.
          </p>
          <Button className="bg-white text-exhibae-navy hover:bg-gray-100" asChild>
            <Link to="/auth/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ForBrands; 