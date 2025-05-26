import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { usePublishedExhibitions } from '@/hooks/useExhibitionsData';
import { format } from 'date-fns';
import { MapPin, Calendar, Search, Filter, ShoppingBag, Tag, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const Home = () => {
  const { data: exhibitions, isLoading, error } = usePublishedExhibitions(6); // Increased to show more exhibitions
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleAppStoreClick = () => {
    window.open('https://apps.apple.com/app/exhibae', '_blank');
  };

  const handlePlayStoreClick = () => {
    window.open('https://play.google.com/store/apps/details?id=com.exhibae', '_blank');
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-r from-exhibae-navy to-exhibae-teal text-white py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Discover Amazing Shopping Events
            </h1>
            <p className="text-xl mb-12 text-gray-100">
              Find the best exhibitions and shopping events near you
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  type="text"
                  placeholder="Search exhibitions by name, category, or location..."
                  className="pl-10 py-6 bg-white text-gray-900 w-full rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                size="lg"
                className="bg-exhibae-coral hover:bg-opacity-90 text-white px-8"
                asChild
              >
                <Link to="/exhibitions">Search</Link>
              </Button>
            </div>

            {/* Quick Category Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="px-4 py-2 bg-white/10 hover:bg-white/20 cursor-pointer">
                Fashion & Apparel
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 bg-white/10 hover:bg-white/20 cursor-pointer">
                Home & Living
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 bg-white/10 hover:bg-white/20 cursor-pointer">
                Electronics
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 bg-white/10 hover:bg-white/20 cursor-pointer">
                Food & Beverages
              </Badge>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-white" style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}></div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-exhibae-navy">Why Shop at Exhibitions?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-exhibae-light-gray w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-exhibae-navy" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-exhibae-navy">Exclusive Products</h3>
              <p className="text-gray-600">
                Discover unique items and limited editions not available in regular stores
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-exhibae-light-gray w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag className="w-8 h-8 text-exhibae-navy" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-exhibae-navy">Special Deals</h3>
              <p className="text-gray-600">
                Get access to exhibition-only discounts and promotional offers
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-exhibae-light-gray w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-exhibae-navy" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-exhibae-navy">Meet the Brands</h3>
              <p className="text-gray-600">
                Interact directly with brand owners and get personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Exhibitions */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-exhibae-navy">Upcoming Exhibitions</h2>
            <Link to="/exhibitions" className="text-exhibae-coral hover:underline font-medium">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              <div className="col-span-3 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-exhibae-navy mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading amazing exhibitions...</p>
              </div>
            ) : error ? (
              <div className="col-span-3 text-center py-12 text-red-500">
                <p className="text-xl mb-2">Oops! Something went wrong.</p>
                <p>Please try refreshing the page.</p>
              </div>
            ) : exhibitions && exhibitions.length > 0 ? (
              exhibitions.map((exhibition) => (
                <div key={exhibition.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="relative">
                    <img 
                      src={exhibition.banner_image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80"} 
                      alt={exhibition.title} 
                      className="w-full h-48 object-cover"
                    />
                    {exhibition.category && (
                      <span className="absolute top-4 right-4 text-xs font-semibold bg-white/90 text-exhibae-navy py-1 px-3 rounded-full">
                        {exhibition.category.name}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-exhibae-navy hover:text-exhibae-coral transition-colors">
                      {exhibition.title}
                    </h3>
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {exhibition.description}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        {`${exhibition.city}, ${exhibition.country}`}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {`${format(new Date(exhibition.start_date), 'MMM d')} - ${format(new Date(exhibition.end_date), 'MMM d, yyyy')}`}
                      </div>
                    </div>
                    <Button className="w-full mt-6 bg-exhibae-navy hover:bg-opacity-90" asChild>
                      <Link to={`/exhibitions/${exhibition.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-600 mb-4">No exhibitions available at the moment.</p>
                <Button variant="outline" asChild>
                  <Link to="/exhibitions">Browse All Exhibitions</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-exhibae-navy">Never Miss an Exhibition</h2>
            <p className="text-xl mb-8 text-gray-600">
              Subscribe to our newsletter and be the first to know about upcoming exhibitions and exclusive deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <Input 
                type="email" 
                placeholder="Enter your email address"
                className="flex-1"
              />
              <Button className="bg-exhibae-navy hover:bg-opacity-90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-exhibae-navy">Get the ExhiBae App</h2>
              <p className="text-xl mb-8 text-gray-600">
                Download our mobile app to get real-time updates about exhibitions, exclusive mobile-only deals, and easy navigation at the venue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-black hover:bg-opacity-90" onClick={handleAppStoreClick}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.07 2.7.61 3.44 1.57-3.14 1.88-2.29 6.12.82 7.33-.64 1.87-1.49 3.71-2.85 4.13zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.66 4.23-3.74 4.25z"/>
                  </svg>
                  App Store
                </Button>
                <Button className="bg-black hover:bg-opacity-90" onClick={handlePlayStoreClick}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.184l2.81-2.81 4.383 2.54c.55.318.89.906.89 1.542 0 .636-.34 1.224-.89 1.542l-4.382 2.54-2.81-2.81 2.81-2.544-2.81-2.54z"/>
                  </svg>
                  Play Store
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <img 
                src="/app-preview.png" 
                alt="ExhiBae Mobile App" 
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
