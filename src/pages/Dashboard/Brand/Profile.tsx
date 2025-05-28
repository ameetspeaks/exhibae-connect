import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { useBrandProfile, type BrandProfile as BrandProfileType } from "@/hooks/useBrandProfile";

const BrandProfile = () => {
  const { user } = useAuth();
  const { data: profile } = useBrandProfile() as { data: BrandProfileType | undefined };

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

      {/* Cover Image */}
      <div className="relative w-full h-48 mb-16 rounded-lg overflow-hidden bg-gray-100">
        {profile?.cover_image_url ? (
          <img
            src={profile.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No cover image
          </div>
        )}
        
        {/* Logo Image - Positioned at the bottom of cover image */}
        <div className="absolute -bottom-8 left-8">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden">
            {profile?.logo_url ? (
              <img
                src={profile.logo_url}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                {profile?.company_name?.charAt(0) || "B"}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{profile?.company_name || "Brand Name"}</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1">{profile?.description || "No description available"}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Contact Email</label>
              <p className="mt-1">{profile?.contact_email}</p>
            </div>
            
            {profile?.contact_phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                <p className="mt-1">{profile.contact_phone}</p>
              </div>
            )}
            
            {profile?.website && (
              <div>
                <label className="text-sm font-medium text-gray-500">Website</label>
                <p className="mt-1">
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {profile.website}
                  </a>
                </p>
              </div>
            )}
            
            {/* Social Media Links */}
            <div>
              <label className="text-sm font-medium text-gray-500">Social Media</label>
              <div className="mt-2 flex gap-4">
                {profile?.facebook_url && (
                  <a
                    href={profile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {profile?.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {profile?.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandProfile; 