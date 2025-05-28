import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, BarChart3, Calendar, Users, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForBrands() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Search className="w-8 h-8 text-exhibae-navy" />,
      title: "Find Exhibitions",
      description: "Discover relevant exhibitions in your industry. Filter by category, location, and date."
    },
    {
      icon: <ShoppingBag className="w-8 h-8 text-exhibae-navy" />,
      title: "Book Stalls",
      description: "Choose and book stalls that match your requirements. Secure prime locations early."
    },
    {
      icon: <Calendar className="w-8 h-8 text-exhibae-navy" />,
      title: "Event Calendar",
      description: "Keep track of upcoming exhibitions and important dates. Never miss an opportunity."
    },
    {
      icon: <Users className="w-8 h-8 text-exhibae-navy" />,
      title: "Network & Connect",
      description: "Connect with organizers, other brands, and potential customers. Build valuable relationships."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-exhibae-navy" />,
      title: "Performance Analytics",
      description: "Track your exhibition performance. Measure ROI and engagement metrics."
    },
    {
      icon: <Globe className="w-8 h-8 text-exhibae-navy" />,
      title: "Brand Visibility",
      description: "Showcase your brand to a targeted audience. Increase your market presence."
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      company: "Fashion Forward",
      text: "ExhiBae has transformed how we participate in exhibitions. The platform makes it incredibly easy to find and book relevant shows."
    },
    {
      name: "Rajesh Kumar",
      company: "Tech Solutions Inc",
      text: "The analytics and insights provided by ExhiBae have helped us maximize our ROI from exhibitions. Highly recommended!"
    },
    {
      name: "Sarah Williams",
      company: "Organic Foods Co",
      text: "We've seen a 40% increase in our exhibition success rate since using ExhiBae. The platform is a game-changer."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Hero Section */}
      <div className="text-center mb-16 py-12">
        <h1 className="text-4xl font-bold text-exhibae-navy mb-4">
          Grow Your Brand Through Exhibitions
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of successful brands using ExhiBae to discover, participate in, 
          and maximize returns from exhibitions across India.
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => navigate("/auth/register")}
            className="bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]"
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/exhibitions")}
            className="border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]"
          >
            Browse Exhibitions
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 px-6">
        {features.map((feature, index) => (
          <div key={index} className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-[#F5E4DA]">
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Success Stats */}
      <div className="bg-[#F5E4DA] p-8 rounded-lg mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Why Brands Choose ExhiBae</h2>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">5000+</div>
            <div className="text-gray-600">Active Brands</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">95%</div>
            <div className="text-gray-600">Booking Success Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">40%</div>
            <div className="text-gray-600">Average ROI Increase</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-exhibae-navy mb-2">24/7</div>
            <div className="text-gray-600">Support Available</div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">What Brands Say About Us</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-6 bg-white rounded-lg shadow">
              <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
              <div>
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-gray-500">{testimonial.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-[#4B1E25] text-[#F5E4DA]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Showcase Your Brand?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of successful brands on ExhiBae and take your business to the next level.
          </p>
          <Button className="bg-[#F5E4DA] text-[#4B1E25] hover:bg-[#F5E4DA]/90" asChild>
            <Link to="/auth/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
} 