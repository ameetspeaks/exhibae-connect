
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCheck, X, Search, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const BrandDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Dashboard Overview</h2>
        <Button className="bg-exhibae-navy hover:bg-opacity-90" asChild>
          <Link to="/dashboard/brand/find">
            <Search className="h-4 w-4 mr-2" />
            Find Exhibitions
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Stalls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Stalls</CardTitle>
            <Briefcase className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Current exhibitions</p>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Calendar className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        {/* Approved Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">75% approval rate</p>
          </CardContent>
        </Card>

        {/* Rejected Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">25% rejection rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Exhibitions */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>My Upcoming Stalls</CardTitle>
            <Button variant="link" size="sm" className="text-exhibae-coral" asChild>
              <Link to="/dashboard/brand/applications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Summer Fashion Expo', 'Tech Conference'].map((name, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-md bg-exhibae-navy bg-opacity-10 flex items-center justify-center text-exhibae-navy">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-gray-500">Starts in {i + 2} week{i > 0 ? 's' : ''}</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Exhibitions */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Recommended For You</CardTitle>
            <Button variant="link" size="sm" className="text-exhibae-coral" asChild>
              <Link to="/dashboard/brand/find">View More</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Home & Garden Expo', 'Local Craft Fair', 'Organic Food Market'].map((name, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-md bg-exhibae-coral bg-opacity-10 flex items-center justify-center text-exhibae-coral">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-gray-500">Application ends in {i + 1} week{i > 0 ? 's' : ''}</p>
                  </div>
                  <Button size="sm" className="ml-auto bg-exhibae-navy hover:bg-opacity-90">
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandDashboard;
