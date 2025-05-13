import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { usePublishedExhibitions } from '@/hooks/useExhibitionsData';
import { format } from 'date-fns';
import { MapPin, Calendar } from 'lucide-react';

const Home = () => {
  const { data: exhibitions, isLoading, error } = usePublishedExhibitions(3);
  
  console.log('Featured Exhibitions:', { exhibitions, isLoading, error });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-exhibae-navy to-exhibae-teal text-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Connect, Exhibit, Thrive
              </h1>
              <p className="text-xl mb-8 text-gray-100">
                ExhiBae brings together exhibition organizers, brands, and shoppers in one seamless platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-exhibae-coral hover:bg-opacity-90 text-white"
                  asChild
                >
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-exhibae-navy"
                  asChild
                >
                  <Link to="/exhibitions">Browse Exhibitions</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" 
                alt="Exhibition" 
                className="rounded-lg shadow-xl max-h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-white" style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}></div>
      </section>

      {/* For Organizers, Brands, and Shoppers */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-exhibae-navy">How ExhiBae Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Organizers */}
            <div className="bg-exhibae-light-gray p-8 rounded-lg shadow-sm border border-gray-100 card-hover-effect">
              <div className="bg-exhibae-navy w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-exhibae-navy">For Organizers</h3>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Create and manage exhibitions
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Review brand applications
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Access analytics and insights
                </li>
              </ul>
              <Button variant="outline" className="w-full border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white" asChild>
                <Link to="/for-organizers">Learn More</Link>
              </Button>
            </div>

            {/* For Brands */}
            <div className="bg-exhibae-light-gray p-8 rounded-lg shadow-sm border border-gray-100 card-hover-effect">
              <div className="bg-exhibae-coral w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                  <polyline points="7.5 19.79 7.5 14.6 3 12" />
                  <polyline points="21 12 16.5 14.6 16.5 19.79" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-exhibae-navy">For Brands</h3>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Discover relevant exhibitions
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Apply for stalls seamlessly
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Track performance metrics
                </li>
              </ul>
              <Button variant="outline" className="w-full border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white" asChild>
                <Link to="/for-brands">Learn More</Link>
              </Button>
            </div>

            {/* For Shoppers */}
            <div className="bg-exhibae-light-gray p-8 rounded-lg shadow-sm border border-gray-100 card-hover-effect">
              <div className="bg-exhibae-teal w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-exhibae-navy">For Shoppers</h3>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Browse exhibitions nearby
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Plan your visits efficiently
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-exhibae-teal mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Discover unique brands
                </li>
              </ul>
              <Button variant="outline" className="w-full border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white" asChild>
                <Link to="/exhibitions">Browse Exhibitions</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Exhibitions */}
      <section className="py-20 bg-exhibae-light-gray">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-exhibae-navy">Featured Exhibitions</h2>
            <Link to="/exhibitions" className="text-exhibae-coral hover:underline font-medium">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              <div className="col-span-3 text-center py-12">Loading exhibitions...</div>
            ) : error ? (
              <div className="col-span-3 text-center py-12 text-red-500">
                Failed to load exhibitions. Please try again later.
              </div>
            ) : exhibitions && exhibitions.length > 0 ? (
              exhibitions.map((exhibition) => (
                <div key={exhibition.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 exhibition-card">
                  <img 
                    src={exhibition.banner_image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80"} 
                    alt={exhibition.title} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    {exhibition.category && (
                      <span className="text-xs font-semibold bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                        {exhibition.category.name}
                      </span>
                    )}
                    <h3 className="text-xl font-semibold mt-2 text-exhibae-navy">{exhibition.title}</h3>
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {exhibition.description}
                    </p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {`${exhibition.city}, ${exhibition.country}`}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {`${format(new Date(exhibition.start_date), 'MMM d')} - ${format(new Date(exhibition.end_date), 'MMM d, yyyy')}`}
                    </div>
                    <Button className="w-full mt-6 bg-exhibae-navy hover:bg-opacity-90" asChild>
                      <Link to={`/exhibitions/${exhibition.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-600">No featured exhibitions available at the moment.</p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link to="/exhibitions">Browse All Exhibitions</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-exhibae-navy">Ready to get started?</h2>
          <p className="text-xl mb-10 text-gray-600 max-w-3xl mx-auto">
            Join thousands of organizers, brands, and shoppers already using ExhiBae to connect and grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-exhibae-navy hover:bg-opacity-90"
              asChild
            >
              <Link to="/signup">Create an Account</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white"
              asChild
            >
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
