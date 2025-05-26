import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const BrandProfile = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button variant="outline" asChild>
          <Link to="/dashboard/brand/settings">
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{getInitials(user?.user_metadata?.company_name || user?.email || '')}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{user?.user_metadata?.company_name || 'Company Name'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Business Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Full Name: </span>
                  <span className="text-sm">{user?.user_metadata?.full_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phone: </span>
                  <span className="text-sm">{user?.user_metadata?.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Website: </span>
                  <span className="text-sm">
                    {user?.user_metadata?.website_url ? (
                      <a 
                        href={user.user_metadata.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {user.user_metadata.website_url}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Social Media: </span>
                  <div className="flex gap-4 mt-1">
                    {user?.user_metadata?.instagram_url && (
                      <a 
                        href={user.user_metadata.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        Instagram
                      </a>
                    )}
                    {user?.user_metadata?.facebook_url && (
                      <a 
                        href={user.user_metadata.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">About</h3>
              <p className="text-sm text-muted-foreground">
                {user?.user_metadata?.description || 'No description provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandProfile; 