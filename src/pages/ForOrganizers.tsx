import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  CreditCard,
  Calendar,
  Settings
} from 'lucide-react';

const ForOrganizers = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-exhibae-navy mb-6">
              Organize Successful Exhibitions with Exhibae
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Streamline your exhibition management process with our comprehensive platform designed for organizers.
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-exhibae-navy hover:bg-opacity-90" asChild>
                <Link to="/auth/register">Get Started</Link>
              </Button>
              <Button variant="outline" className="border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-exhibae-navy text-center mb-12">
            Everything You Need to Manage Exhibitions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <LayoutDashboard className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Intuitive Dashboard
              </h3>
              <p className="text-gray-600">
                Manage all your exhibitions from a centralized dashboard with real-time updates and insights.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <Users className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Brand Management
              </h3>
              <p className="text-gray-600">
                Review and manage brand applications, communicate with exhibitors, and handle bookings efficiently.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <BarChart3 className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Analytics & Insights
              </h3>
              <p className="text-gray-600">
                Access detailed analytics about stall bookings, revenue, and visitor engagement.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <CreditCard className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Payment Processing
              </h3>
              <p className="text-gray-600">
                Secure payment processing with support for multiple payment methods and automated invoicing.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <Calendar className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Event Planning
              </h3>
              <p className="text-gray-600">
                Powerful tools for planning, scheduling, and managing exhibition timelines and logistics.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <Settings className="h-10 w-10 text-exhibae-navy mb-4" />
              <h3 className="text-xl font-semibold text-exhibae-navy mb-3">
                Customization
              </h3>
              <p className="text-gray-600">
                Customize stall layouts, pricing, and exhibition details to match your requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-exhibae-navy text-center mb-12">
            Why Choose Exhibae?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-exhibae-navy mb-6">
                Streamlined Operations
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Automated application processing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Digital contract management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Integrated communication tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Real-time updates and notifications</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-exhibae-navy mb-6">
                Enhanced Revenue
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Dynamic pricing strategies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Multiple revenue streams</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Reduced operational costs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span className="text-gray-600">Increased booking efficiency</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-exhibae-navy text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Exhibition Management?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of successful exhibition organizers using Exhibae.
          </p>
          <Button className="bg-white text-exhibae-navy hover:bg-gray-100" asChild>
            <Link to="/auth/register">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ForOrganizers; 