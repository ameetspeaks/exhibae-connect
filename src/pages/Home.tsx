import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { usePublishedExhibitions } from '@/hooks/useExhibitionsData';
import { format } from 'date-fns';
import { MapPin, Calendar, ShoppingBag, Tag, Users, ChevronDown, Gift, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ImageSlider, { SliderStatus } from '@/components/ImageSlider';
import ExhibitionCard from '@/components/exhibitions/ExhibitionCard';
import { ShopperSections } from '@/components/home/ShopperSections';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from '@/components/ui/logo';

const Home = () => {
  const { data: exhibitions, isLoading, error } = usePublishedExhibitions(6);
  const [sliderStatus, setSliderStatus] = useState<SliderStatus>({ loading: true, hasSlides: false });
  const [selectedCity, setSelectedCity] = useState<string>("Noida");
  const navigate = useNavigate();

  // Get unique cities from exhibitions
  const cities = useMemo(() => {
    if (!exhibitions) return [];
    const uniqueCities = Array.from(new Set(exhibitions.map(e => e.city))).filter(Boolean);
    return ["Noida", ...uniqueCities.filter(city => city !== "Noida")].sort();
  }, [exhibitions]);

  // Filter exhibitions by selected city
  const filteredExhibitions = useMemo(() => {
    if (!exhibitions) return [];
    return exhibitions.filter(exhibition => 
      !selectedCity || exhibition.city === selectedCity
    );
  }, [exhibitions, selectedCity]);
  
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center bg-[#F5E4DA] py-12">
        <div className="relative w-full z-0">
          <ImageSlider onStatusChange={setSliderStatus} />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-[#F5E4DA]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1C1C1C] header-text">Why Exhibae?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-6">
              <div className="bg-[#E6C5B6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-[#1C1C1C]" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-[#1C1C1C] header-text">Unlock Exclusive Deals</h3>
              <p className="text-[#1C1C1C]/80 subheading-text">
                Special discounts for both brands and shoppers — only on Exhibae!
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-[#E6C5B6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-8 h-8 text-[#1C1C1C]" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-[#1C1C1C] header-text">Book Stalls in Seconds</h3>
              <p className="text-[#1C1C1C]/80 subheading-text">
                Browse, compare, and reserve exhibition spots — hassle-free
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-[#E6C5B6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-[#1C1C1C]" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-[#1C1C1C] header-text">Be Seen by the Right Crowd</h3>
              <p className="text-[#1C1C1C]/80 subheading-text">
                Get your brand in front of thousands of exhibition-ready shoppers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Exhibitions */}
      <section className="py-12 bg-[#F5E4DA]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-[#1C1C1C] header-text">Upcoming Exhibitions</h2>
                <div className="w-48">
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="bg-white border-[#E6C5B6] text-[#1C1C1C]">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="link" className="text-[#4B1E25] hover:text-[#4B1E25]/80 font-medium subheading-text" asChild>
                <Link to="/exhibitions">View All</Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {isLoading ? (
              // Loading skeleton
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredExhibitions && filteredExhibitions.length > 0 ? (
              filteredExhibitions.map((exhibition) => (
                <ExhibitionCard
                  key={exhibition.id}
                  exhibition={exhibition}
                  onNavigate={() => navigate(`/exhibitions/${exhibition.id}`)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-[#1C1C1C]/80 mb-4 subheading-text">
                  {selectedCity 
                    ? `No exhibitions available in ${selectedCity} at the moment.`
                    : "No exhibitions available at the moment."}
                </p>
                <Button variant="outline" className="border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA] subheading-text" asChild>
                  <Link to="/exhibitions">Browse All Exhibitions</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Shopper Sections */}
      <ShopperSections />

      {/* Newsletter Section */}
      <section className="py-20 bg-[#F5E4DA]">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-[#1C1C1C] header-text">Never Miss an Exhibition</h2>
            <p className="text-xl mb-8 text-[#1C1C1C]/80 subheading-text">
              Subscribe to our newsletter and be the first to know about upcoming exhibitions and exclusive deals.
            </p>
            <div className="max-w-lg mx-auto">
              <SubscriptionForm variant="minimal" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
