import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Info } from 'lucide-react';
import { StallFormData, Stall, Amenity, MeasuringUnit } from '@/types/exhibition-management';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MeasuringUnitSelect from './MeasuringUnitSelect';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  width: z.coerce.number()
    .min(1, 'Width must be greater than 0')
    .max(1000, 'Width cannot exceed 1000'),
  length: z.coerce.number()
    .min(1, 'Length must be greater than 0')
    .max(1000, 'Length cannot exceed 1000'),
  quantity: z.coerce.number()
    .min(1, 'Quantity must be greater than 0')
    .max(100, 'Quantity cannot exceed 100'),
  price: z.coerce.number()
    .min(0, 'Price must be 0 or greater')
    .max(1000000, 'Price cannot exceed 1,000,000'),
  amenity_ids: z.array(z.string()).default([]),
  unit_id: z.string().min(1, 'Unit is required'),
});

type FormData = z.infer<typeof formSchema>;

interface StallFormProps {
  onSubmit: (data: StallFormData) => void;
  initialData?: Stall;
  amenities: Amenity[];
  measuringUnits: MeasuringUnit[];
  isLoading?: boolean;
}

const StallForm: React.FC<StallFormProps> = ({ 
  onSubmit, 
  initialData, 
  amenities,
  measuringUnits,
  isLoading 
}) => {
  console.log('StallForm measuringUnits:', measuringUnits);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || 'Stall',
      width: initialData?.width || 3,
      length: initialData?.length || 3,
      quantity: initialData?.quantity || 1,
      price: initialData?.price || 0,
      amenity_ids: initialData?.amenities?.map(a => a.id) || [],
      unit_id: initialData?.unit_id || '',
    }
  });

  // Calculate total area and total value
  const { totalArea, totalValue } = useMemo(() => {
    const width = form.watch('width') || 0;
    const length = form.watch('length') || 0;
    const quantity = form.watch('quantity') || 0;
    const price = form.watch('price') || 0;

    return {
      totalArea: width * length * quantity,
      totalValue: price * quantity
    };
  }, [form.watch(['width', 'length', 'quantity', 'price'])]);

  const handleSubmit = (data: FormData) => {
    const formattedData: StallFormData = {
      name: data.name,
      width: data.width,
      length: data.length,
      quantity: data.quantity,
      price: data.price,
      amenity_ids: data.amenity_ids,
      unit_id: data.unit_id
    };
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of your stall configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stall Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Premium Stall" {...field} />
                  </FormControl>
                  <FormDescription>A unique identifier for this stall type</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Measurement Unit</FormLabel>
                  <FormControl>
                    <MeasuringUnitSelect
                      measuringUnits={measuringUnits}
                      selectedUnitId={field.value}
                      onUnitSelect={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="1000"
                        step="0.5"
                        placeholder="Width" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="1000"
                        step="0.5"
                        placeholder="Length" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="100"
                        placeholder="Quantity" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Number of stalls of this type</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="100"
                        placeholder="Price per stall" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Price per stall in Indian Rupees</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-500">Total Area</div>
                <div className="text-lg font-semibold">
                  {form.watch('width') * form.watch('length') * form.watch('quantity')} {measuringUnits.find(u => u.id === form.watch('unit_id'))?.abbreviation || ''}²
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Total Value</div>
                <div className="text-lg font-semibold">₹{(form.watch('price') * form.watch('quantity')).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>Select the amenities available with this stall type.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="amenity_ids"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.map((amenity) => (
                      <FormField
                        key={amenity.id}
                        control={form.control}
                        name="amenity_ids"
                        render={({ field }) => (
                          <FormItem
                            key={amenity.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(amenity.id)}
                                onCheckedChange={(checked) => {
                                  const updatedIds = checked
                                    ? [...field.value || [], amenity.id]
                                    : field.value?.filter((id) => id !== amenity.id) || [];
                                  field.onChange(updatedIds);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {amenity.name}
                              {amenity.description && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 inline-block ml-1 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{amenity.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update' : 'Add'} Stall Configuration
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StallForm;
