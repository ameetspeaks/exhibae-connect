import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send the data to a server
    toast({
      title: "Message Sent",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Mail className="w-6 h-6 text-exhibae-navy mt-1" />
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600">
                  General Inquiries: info@exhibae.com
                  <br />
                  Support: support@exhibae.com
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-exhibae-navy mt-1" />
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-gray-600">
                  India: +91 (22) 4567-8900
                  <br />
                  International: +1 (555) 123-4567
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-exhibae-navy mt-1" />
              <div>
                <h3 className="font-medium">Address</h3>
                <p className="text-gray-600">
                  ExhiBae Technologies
                  <br />
                  Level 23, Trade Centre
                  <br />
                  Bandra Kurla Complex
                  <br />
                  Mumbai, Maharashtra 400051
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Clock className="w-6 h-6 text-exhibae-navy mt-1" />
              <div>
                <h3 className="font-medium">Business Hours</h3>
                <p className="text-gray-600">
                  Monday - Friday: 9:00 AM - 6:00 PM IST
                  <br />
                  Saturday: 10:00 AM - 2:00 PM IST
                  <br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="What is this regarding?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Your message"
                rows={5}
              />
            </div>

            <Button type="submit" className="w-full bg-exhibae-navy hover:bg-exhibae-navy/90">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 