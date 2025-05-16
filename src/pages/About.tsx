import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-exhibae-navy text-center mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-exhibae-navy mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                At ExhiBae, we're revolutionizing the exhibition industry by creating a digital ecosystem that brings together organizers, brands, and shoppers. Our platform simplifies the exhibition management process while enhancing the experience for all stakeholders.
              </p>
              <p className="text-gray-600">
                We believe in the power of physical exhibitions and their ability to create meaningful connections between brands and customers. Our goal is to enhance these connections through technology.
              </p>
            </div>
            <div className="bg-exhibae-light-gray rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-exhibae-navy mb-6">Key Features</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span>Smart exhibition management tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span>Streamlined stall booking process</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span>Real-time analytics and insights</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exhibae-coral mr-3">•</span>
                  <span>Integrated payment solutions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-exhibae-navy text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold text-exhibae-navy mb-4">Innovation</h3>
              <p className="text-gray-600">
                We continuously strive to bring innovative solutions to the exhibition industry, making processes more efficient and user-friendly.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold text-exhibae-navy mb-4">Transparency</h3>
              <p className="text-gray-600">
                We believe in maintaining complete transparency in our operations, pricing, and communication with all stakeholders.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold text-exhibae-navy mb-4">Excellence</h3>
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
          <h2 className="text-3xl font-bold text-exhibae-navy mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join ExhiBae today and transform your exhibition experience.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-exhibae-navy hover:bg-opacity-90" asChild>
              <Link to="/auth/register">Sign Up Now</Link>
            </Button>
            <Button variant="outline" className="border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 