import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5E4DA]/10">
      {/* Hero Section */}
      <section className="py-20 bg-[#F5E4DA]">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-6">
            About ExhiBae
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            Connecting Exhibition Organizers, Brands, and Shoppers in one seamless platform.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                At ExhiBae, we're on a mission to revolutionize the exhibition industry by creating a seamless digital platform that connects organizers, brands, and shoppers. We believe in making exhibition participation more accessible, efficient, and rewarding for everyone involved.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                We envision a future where discovering and participating in exhibitions is as easy as a few clicks. Our platform aims to be the go-to destination for exhibition stakeholders worldwide, fostering meaningful connections and business growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-[#F5E4DA]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600">
                We continuously strive to bring innovative solutions to the exhibition industry, making processes more efficient and user-friendly.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Transparency</h3>
              <p className="text-gray-600">
                We believe in maintaining complete transparency in our operations, pricing, and communication with all stakeholders.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600">
                We are committed to delivering excellence in every aspect of our service, from platform stability to customer support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join ExhiBae today and transform your exhibition experience.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]" asChild>
              <Link to="/auth/register">Sign Up Now</Link>
            </Button>
            <Button variant="outline" className="border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 