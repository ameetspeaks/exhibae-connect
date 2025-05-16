import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-exhibae-navy text-center mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            Have questions? We're here to help. Reach out to our team.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-exhibae-navy mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Message subject" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Your message" 
                    className="min-h-[150px]"
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-exhibae-navy hover:bg-opacity-90">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-exhibae-navy mb-6">Contact Information</h2>
                <p className="text-gray-600 mb-8">
                  Our team is available Monday through Friday, 9:00 AM to 6:00 PM IST.
                </p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardContent className="flex items-center space-x-4 p-6">
                    <Mail className="h-6 w-6 text-exhibae-navy" />
                    <div>
                      <h3 className="font-semibold text-exhibae-navy">Email</h3>
                      <p className="text-gray-600">support@exhibae.com</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center space-x-4 p-6">
                    <Phone className="h-6 w-6 text-exhibae-navy" />
                    <div>
                      <h3 className="font-semibold text-exhibae-navy">Phone</h3>
                      <p className="text-gray-600">+91 (800) 123-4567</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center space-x-4 p-6">
                    <MapPin className="h-6 w-6 text-exhibae-navy" />
                    <div>
                      <h3 className="font-semibold text-exhibae-navy">Address</h3>
                      <p className="text-gray-600">
                        123 Exhibition Street<br />
                        Mumbai, Maharashtra 400001<br />
                        India
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-exhibae-light-gray rounded-lg p-6 mt-8">
                <h3 className="font-semibold text-exhibae-navy mb-2">Business Hours</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>Monday - Friday: 9:00 AM - 6:00 PM IST</li>
                  <li>Saturday: 10:00 AM - 2:00 PM IST</li>
                  <li>Sunday: Closed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact; 