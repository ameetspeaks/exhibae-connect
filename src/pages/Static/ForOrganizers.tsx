import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3, Calendar, Layout, Users, Settings, PieChart } from "lucide-react";

export default function ForOrganizers() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-exhibae-navy" />,
      title: "Exhibition Management",
      description: "Create and manage exhibitions with ease. Set dates, venues, and categories all in one place."
    },
    {
      icon: <Layout className="w-8 h-8 text-exhibae-navy" />,
      title: "Stall Layout Designer",
      description: "Design your exhibition layout with our intuitive drag-and-drop interface. Optimize space utilization."
    },
    {
      icon: <Users className="w-8 h-8 text-exhibae-navy" />,
      title: "Brand Applications",
      description: "Review and manage brand applications. Communicate directly with potential exhibitors."
    },
    {
      icon: <Settings className="w-8 h-8 text-exhibae-navy" />,
      title: "Customization Options",
      description: "Customize stall types, pricing, and amenities. Create the perfect setup for your exhibition."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-exhibae-navy" />,
      title: "Real-time Analytics",
      description: "Track applications, revenue, and engagement. Make data-driven decisions."
    },
    {
      icon: <PieChart className="w-8 h-8 text-exhibae-navy" />,
      title: "Financial Reports",
      description: "Generate detailed financial reports. Monitor revenue streams and expenses."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-exhibae-navy mb-4">
          Organize Successful Exhibitions
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          ExhiBae provides everything you need to create, manage, and grow your exhibitions. 
          From planning to execution, we've got you covered.
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => navigate("/auth/register")}
            className="bg-exhibae-coral hover:bg-exhibae-coral/90"
          >
            Create Exhibition
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/contact")}
          >
            Contact Sales
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => (
          <div key={index} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-50 p-8 rounded-lg mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Basic</h3>
            <div className="text-3xl font-bold text-exhibae-navy mb-4">₹9,999/mo</div>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>Up to 2 exhibitions</li>
              <li>Basic analytics</li>
              <li>Email support</li>
              <li>Standard layouts</li>
            </ul>
            <Button className="w-full" variant="outline">Get Started</Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-exhibae-navy">
            <h3 className="text-xl font-semibold mb-2">Professional</h3>
            <div className="text-3xl font-bold text-exhibae-navy mb-4">₹24,999/mo</div>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>Up to 5 exhibitions</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
              <li>Custom layouts</li>
            </ul>
            <Button className="w-full bg-exhibae-navy hover:bg-exhibae-navy/90">Get Started</Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
            <div className="text-3xl font-bold text-exhibae-navy mb-4">Custom</div>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>Unlimited exhibitions</li>
              <li>Custom analytics</li>
              <li>24/7 support</li>
              <li>Custom solutions</li>
            </ul>
            <Button className="w-full" variant="outline">Contact Sales</Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6">
          Join thousands of successful exhibition organizers on ExhiBae
        </p>
        <Button 
          onClick={() => navigate("/auth/register")}
          className="bg-exhibae-navy hover:bg-exhibae-navy/90"
        >
          Create Your First Exhibition
        </Button>
      </div>
    </div>
  );
} 