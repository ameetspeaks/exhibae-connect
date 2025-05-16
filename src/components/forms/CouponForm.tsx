import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { Coupon, CreateCouponDTO } from '@/types/coupon';
import { checkCouponCodeExists } from '@/utils/coupon';

interface CouponFormProps {
  initialData?: Coupon;
  onSubmit: (data: CreateCouponDTO) => Promise<void>;
  isLoading: boolean;
}

interface Exhibition {
  id: string;
  title: string;
}

interface Brand {
  id: string;
  email: string;
}

export function CouponForm({ initialData, onSubmit, isLoading }: CouponFormProps) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const formSchema = z.object({
    code: z.string()
      .min(3, 'Code must be at least 3 characters')
      .max(50),
    description: z.string().optional(),
    type: z.enum(['percentage', 'fixed'] as const),
    value: z.number()
      .min(0, 'Value must be greater than 0'),
    scope: z.enum(['all_exhibitions', 'specific_exhibition', 'all_brands', 'specific_brand'] as const),
    exhibition_id: z.string().optional(),
    brand_id: z.string().optional(),
    min_booking_amount: z.number().optional(),
    max_discount_amount: z.number().optional(),
    usage_limit: z.number().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: initialData?.code || '',
      description: initialData?.description || '',
      type: initialData?.type || 'percentage',
      value: initialData?.value || 0,
      scope: initialData?.scope || 'all_exhibitions',
      exhibition_id: initialData?.exhibition_id,
      brand_id: initialData?.brand_id,
      min_booking_amount: initialData?.min_booking_amount,
      max_discount_amount: initialData?.max_discount_amount,
      usage_limit: initialData?.usage_limit,
      start_date: initialData?.start_date ? new Date(initialData.start_date) : undefined,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : undefined,
    },
  });

  // Add percentage validation on type change
  const watchType = form.watch('type');
  const watchScope = form.watch('scope');

  useEffect(() => {
    const value = form.getValues('value');
    if (watchType === 'percentage' && value > 100) {
      form.setError('value', {
        type: 'manual',
        message: 'Percentage must be between 0 and 100',
      });
    } else {
      form.clearErrors('value');
    }
  }, [watchType, form]);

  // Add code uniqueness validation on blur
  const handleCodeBlur = async () => {
    const code = form.getValues('code');
    if (code) {
      const exists = await checkCouponCodeExists(code, initialData?.id);
      if (exists) {
        form.setError('code', {
          type: 'manual',
          message: 'This coupon code already exists. Please choose a different code.',
        });
      }
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        // Fetch exhibitions
        const { data: exhibitionsData, error: exhibitionsError } = await supabase
          .from('exhibitions')
          .select('id, title')
          .eq('status', 'published');

        if (exhibitionsError) throw exhibitionsError;
        setExhibitions(exhibitionsData || []);

        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('role', 'brand');

        if (brandsError) throw brandsError;
        setBrands(brandsData || []);
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const onFormSubmit = async (values: FormValues) => {
    try {
      // Check if code exists one more time before submitting
      const codeExists = await checkCouponCodeExists(values.code, initialData?.id);
      if (codeExists) {
        form.setError('code', {
          type: 'manual',
          message: 'This coupon code already exists. Please choose a different code.',
        });
        return;
      }

      const formattedData: CreateCouponDTO = {
        code: values.code,
        description: values.description,
        type: values.type,
        value: values.value,
        scope: values.scope,
        exhibition_id: values.exhibition_id,
        brand_id: values.brand_id,
        min_booking_amount: values.min_booking_amount,
        max_discount_amount: values.max_discount_amount,
        usage_limit: values.usage_limit,
        start_date: values.start_date?.toISOString(),
        end_date: values.end_date?.toISOString(),
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle error appropriately
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coupon Code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="SUMMER2024" onBlur={handleCodeBlur} />
              </FormControl>
              <FormDescription>
                Enter a unique code for this coupon
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Summer sale discount" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    placeholder={watchType === 'percentage' ? '10' : '100'}
                  />
                </FormControl>
                <FormDescription>
                  {watchType === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all_exhibitions">All Exhibitions</SelectItem>
                  <SelectItem value="specific_exhibition">Specific Exhibition</SelectItem>
                  <SelectItem value="all_brands">All Brands</SelectItem>
                  <SelectItem value="specific_brand">Specific Brand</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchScope === 'specific_exhibition' && (
          <FormField
            control={form.control}
            name="exhibition_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exhibition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exhibition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {exhibitions.map((exhibition) => (
                      <SelectItem key={exhibition.id} value={exhibition.id}>
                        {exhibition.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchScope === 'specific_brand' && (
          <FormField
            control={form.control}
            name="brand_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_booking_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Booking Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    placeholder="0"
                  />
                </FormControl>
                <FormDescription>
                  Minimum amount required to use this coupon
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_discount_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Discount Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    placeholder="0"
                  />
                </FormControl>
                <FormDescription>
                  Maximum discount amount allowed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="usage_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage Limit</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  placeholder="No limit"
                />
              </FormControl>
              <FormDescription>
                Maximum number of times this coupon can be used
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || (form.getValues("start_date") && date < form.getValues("start_date"))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Coupon'}
        </Button>
      </form>
    </Form>
  );
} 