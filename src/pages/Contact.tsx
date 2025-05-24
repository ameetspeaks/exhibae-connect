import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          }
        ]);

      if (error) {
        throw error;
      }

      // Reset form and show success
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSuccess(true);
      
      toast({
        title: "Message Sent",
        description: "Thank you for your message. We'll get back to you soon.",
      });

      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
              
              {isSuccess ? (
                <div className="bg-green-50 text-green-800 p-6 rounded-lg flex items-center space-x-3 animate-fade-in">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">Message Sent!</h3>
                    <p>Thank you for contacting us. We'll respond to your inquiry soon.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Message subject" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Your message" 
                      className="min-h-[150px]"
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-exhibae-navy hover:bg-opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
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