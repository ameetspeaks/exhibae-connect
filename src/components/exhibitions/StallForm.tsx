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
import { useToast } from '@/hooks/use-toast';
import MeasuringUnitSelect from './MeasuringUnitSelect';

interface StallFormProps {
  onSubmit: (data: StallFormData) => void;
  initialData?: Stall;
  amenities: Amenity[];
  measuringUnits: MeasuringUnit[];
  isLoading?: boolean;
  lockedUnitId?: string;
  existingStalls?: Stall[];
}

const StallForm: React.FC<StallFormProps> = ({ 
  onSubmit, 
  initialData, 
  amenities,
  measuringUnits,
  isLoading,
  lockedUnitId,
  existingStalls = []
}) => {
  const { toast } = useToast();

  // Effect to update form value when lockedUnitId changes
  React.useEffect(() => {
    if (lockedUnitId) {
      form.setValue('unit_id', lockedUnitId);
    }
  }, [lockedUnitId]);

  const formSchema = z.object({
    name: z.string().default('Basic'),
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
      .min(1, 'Price must be greater than 0')
      .max(1000000, 'Price cannot exceed 1,000,000'),
    amenity_ids: z.array(z.string()).default([]),
    unit_id: z.string().min(1, 'Unit is required'),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || 'Basic',
      width: initialData?.width || 3,
      length: initialData?.length || 3,
      quantity: initialData?.quantity || 1,
      price: initialData?.price || 0,
      amenity_ids: initialData?.amenities?.map(a => a.id) || [],
      unit_id: lockedUnitId || initialData?.unit_id || '',
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
    // Check for duplicates only when creating a new stall (not editing)
    if (!initialData) {
      const isDuplicate = existingStalls.some(stall => 
        stall.name.toLowerCase() === data.name.toLowerCase() &&
        stall.width === data.width &&
        stall.length === data.length
      );

      if (isDuplicate) {
        toast({
          title: "Duplicate Stall Configuration",
          description: "A stall with the same name and dimensions already exists. Please either:\n1. Edit the existing stall\n2. Use different dimensions\n3. Choose a different stall name",
          variant: "destructive"
        });
        return;
      }
    }

    const formattedData: StallFormData = {
      name: data.name,
      width: data.width,
      length: data.length,
      quantity: data.quantity,
      price: data.price,
      amenity_ids: data.amenity_ids,
      unit_id: lockedUnitId || data.unit_id
    };
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure your stall specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Stall Name */}
            <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                  <FormItem className="flex-1">
                  <FormLabel>Stall Name</FormLabel>
                  <FormControl>
                      <Input placeholder="Basic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            {/* Row 2: Dimensions and Unit */}
            <div className="grid grid-cols-3 gap-4">
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
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Unit</FormLabel>
                      {(!lockedUnitId || existingStalls.length === 0) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs space-y-2">
                                <p className="font-medium">Select Measuring Unit</p>
                                <p>Choose the measuring unit that will be used for all stalls in this exhibition. This cannot be changed once stalls are created.</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <FormControl>
                      <MeasuringUnitSelect
                        measuringUnits={measuringUnits}
                        selectedUnitId={lockedUnitId || field.value}
                        onUnitSelect={field.onChange}
                        disabled={!!lockedUnitId || existingStalls.length > 0}
                      />
                    </FormControl>
                    {!!lockedUnitId && (
                      <FormDescription className="text-xs">
                        Unit is locked as stalls have been created
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Price, Quantity, and Calculations */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Stall (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="100"
                        placeholder="Price" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Total</FormLabel>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Area:</span>{' '}
                    <span className="font-medium">{totalArea.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Value:</span>{' '}
                    <span className="font-medium">₹{totalValue.toFixed(2)}</span>
            </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Stall
            </Button>
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
      </form>
    </Form>
  );
};

export default StallForm;
