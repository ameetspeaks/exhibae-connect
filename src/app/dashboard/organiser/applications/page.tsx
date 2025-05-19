"use client";

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { Loader2 } from 'lucide-react';
import type { Application } from './columns';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchApplications() {
      try {
        // Get the current user's ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setApplications([]);
          return;
        }

        // First get the organizer's exhibitions
        const { data: exhibitions, error: exhibitionsError } = await supabase
          .from('exhibitions')
          .select('id')
          .eq('organiser_id', user.id);

        if (exhibitionsError) {
          console.error('Error fetching exhibitions:', exhibitionsError);
          setApplications([]);
          return;
        }

        if (!exhibitions || exhibitions.length === 0) {
          setApplications([]);
          return;
        }

        // Then get applications for those exhibitions
        const { data: applications, error } = await supabase
          .from('stall_applications')
          .select(`
            *,
            exhibition:exhibitions(
              id,
              title,
              start_date,
              end_date
            ),
            brand:profiles!stall_applications_brand_id_fkey(
              id,
              business_name,
              email
            ),
            stall:stalls(
              id,
              name,
              price
            ),
            payment_submission:payment_submissions(
              id,
              amount,
              transaction_id,
              email,
              notes,
              proof_file_url,
              status,
              rejection_reason,
              rejection_date,
              reviewed_at,
              reviewed_by
            )
          `)
          .in('exhibition_id', exhibitions.map(e => e.id))
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching applications:', error);
          setApplications([]);
          return;
        }

        const formattedApplications = applications.map(app => ({
          id: app.id,
          status: app.status,
          payment_submission: app.payment_submission?.[0] || null,
          brand_id: app.brand_id,
          exhibition_id: app.exhibition_id,
          stall_id: app.stall_id,
          created_at: app.created_at,
          updated_at: app.updated_at,
          exhibition_title: app.exhibition?.title || 'Unknown Exhibition',
          brand_name: app.brand?.business_name || 'Unknown Brand',
          stall_name: app.stall?.name || 'Unknown Stall',
          stall_price: app.stall?.price || 0,
        })) as Application[];

        setApplications(formattedApplications);
      } catch (error) {
        console.error('Error:', error);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplications();
  }, [supabase]);

  const filteredApplications = applications.filter(app => {
    // Status filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') {
      return ['pending', 'payment_pending', 'payment_review'].includes(app.status);
    }
    return app.status === statusFilter;
  }).filter(app =>
    searchTerm === '' ||
    app.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.stall_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter(app => ['pending', 'payment_pending', 'payment_review'].includes(app.status)).length,
    booked: applications.filter(app => app.status === 'booked').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Stall Applications</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold">{stats.booked}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <Input
            placeholder="Search by brand, company, or stall..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          
          <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full md:w-auto">
            <TabsList className="h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="all" className="px-4">
                All
              </TabsTrigger>
              <TabsTrigger value="pending" className="px-4">
                Pending
              </TabsTrigger>
              <TabsTrigger value="booked" className="px-4">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="px-4">
                Rejected
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Applications Table */}
      <DataTable columns={columns} data={filteredApplications} />
    </div>
  );
} 