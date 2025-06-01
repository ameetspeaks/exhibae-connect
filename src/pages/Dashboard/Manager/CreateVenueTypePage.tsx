import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CreateVenueTypePage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVenueType, setNewVenueType] = useState({ name: '', description: '' });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (!newVenueType.name.trim()) {
        toast({
          title: "Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('venue_types')
        .insert([
          {
            name: newVenueType.name.trim(),
            description: newVenueType.description.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "A venue type with this name already exists",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Venue type created successfully",
      });

      // Navigate back to venue types list
      navigate('/dashboard/manager/venue-types');
    } catch (error: any) {
      console.error('Error creating venue type:', error);
      toast({
        title: "Error",
        description: "An error occurred while creating the venue type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create Venue Type</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Type Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter venue type name"
                  value={newVenueType.name}
                  onChange={(e) => setNewVenueType({ ...newVenueType, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Enter venue type description"
                  value={newVenueType.description}
                  onChange={(e) => setNewVenueType({ ...newVenueType, description: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/manager/venue-types')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Venue Type
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateVenueTypePage; 