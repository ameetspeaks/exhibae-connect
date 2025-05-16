import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-exhibae-navy mb-4">
          Welcome to ExhiBae
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Transforming the Exhibition Industry Through Innovation
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => navigate("/auth/register")}
            className="bg-exhibae-coral hover:bg-exhibae-coral/90"
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/exhibitions")}
          >
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-3">For Organizers</h3>
          <p className="text-gray-600 mb-4">
            Create and manage exhibitions effortlessly. Track applications, manage stalls, and get real-time analytics.
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate("/dashboard/organiser")}
          >
            Create Exhibition →
          </Button>
        </div>

        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-3">For Brands</h3>
          <p className="text-gray-600 mb-4">
            Discover exhibitions, apply for stalls, and showcase your brand to the right audience.
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate("/dashboard/brand")}
          >
            Find Exhibitions →
          </Button>
        </div>

        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-3">For Managers</h3>
          <p className="text-gray-600 mb-4">
            Oversee multiple exhibitions, coordinate with organizers and brands, and ensure smooth operations.
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate("/dashboard/manager")}
          >
            Manage Events →
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 p-8 rounded-lg mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Why Choose ExhiBae?</h2>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">500+</div>
            <div className="text-gray-600">Exhibitions Hosted</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">10,000+</div>
            <div className="text-gray-600">Brands Connected</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">50+</div>
            <div className="text-gray-600">Cities Covered</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">95%</div>
            <div className="text-gray-600">Satisfaction Rate</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6">
          Join ExhiBae today and transform how you manage exhibitions
        </p>
        <Button 
          onClick={() => navigate("/auth/register")}
          className="bg-exhibae-navy hover:bg-exhibae-navy/90"
        >
          Create an Account
        </Button>
      </div>
    </div>
  );
} 