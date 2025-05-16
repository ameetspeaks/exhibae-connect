import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Coupon } from '@/types/coupon';
import { transformCouponData } from '@/utils/coupon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CouponsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, [user]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('coupons')
        .select(`
          *,
          exhibitions (title),
          brand:profiles!coupons_brand_id_fkey (email),
          organiser:profiles!coupons_organiser_id_fkey (email)
        `)
        .eq('organiser_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = (rawData || []).map(transformCouponData);
      setCoupons(transformedData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch coupons. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;

      setCoupons(coupons.map(c => 
        c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
      ));

      toast({
        title: 'Success',
        description: `Coupon ${coupon.code} ${!coupon.is_active ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update coupon status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', selectedCoupon.id);

      if (error) throw error;

      setCoupons(coupons.filter(c => c.id !== selectedCoupon.id));
      setDeleteDialogOpen(false);
      setSelectedCoupon(null);

      toast({
        title: 'Success',
        description: `Coupon ${selectedCoupon.code} deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getScopeLabel = (coupon: Coupon) => {
    switch (coupon.scope) {
      case 'all_exhibitions':
        return 'All Exhibitions';
      case 'specific_exhibition':
        return `Exhibition: ${coupon.exhibitions?.title || 'Unknown'}`;
      case 'all_brands':
        return 'All Brands';
      case 'specific_brand':
        return `Brand: ${coupon.users?.email || 'Unknown'}`;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons for your exhibitions
          </p>
        </div>
        <Button onClick={() => navigate('create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            View and manage all your discount coupons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>
                    <Badge variant={coupon.type === 'percentage' ? 'default' : 'secondary'}>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                    </Badge>
                  </TableCell>
                  <TableCell>{coupon.value}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getScopeLabel(coupon)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.usage_limit ? `${coupon.times_used}/${coupon.usage_limit}` : coupon.times_used}
                  </TableCell>
                  <TableCell>
                    {coupon.start_date && coupon.end_date ? (
                      <>
                        {format(new Date(coupon.start_date), 'MMM d, yyyy')}
                        <br />
                        to
                        <br />
                        {format(new Date(coupon.end_date), 'MMM d, yyyy')}
                      </>
                    ) : (
                      'No expiry'
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={() => handleToggleActive(coupon)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <Tag className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`${coupon.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {coupons.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Tag className="h-8 w-8 text-gray-400" />
                      <p className="text-lg font-medium">No coupons found</p>
                      <p className="text-sm text-muted-foreground">
                        Create your first coupon to get started
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => navigate('create')}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Coupon
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon "{selectedCoupon?.code}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage; 