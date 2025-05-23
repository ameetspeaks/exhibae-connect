import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Brand {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  avatar_url?: string;
  created_at: string;
}

const OrganiserBrands = () => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Brand[];
    },
  });

  const filteredBrands = React.useMemo(() => {
    if (!brands) return [];
    return brands.filter(
      (brand) =>
        brand.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [brands, searchTerm]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Brands</h1>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={brand.avatar_url} />
                    <AvatarFallback>
                      {getInitials(brand.company_name || brand.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{brand.company_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{brand.full_name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {brand.email}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Joined:</span>{" "}
                    {new Date(brand.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredBrands.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No brands found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganiserBrands; 