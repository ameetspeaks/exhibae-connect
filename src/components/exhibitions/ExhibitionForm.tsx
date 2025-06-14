import React, { useEffect, useState } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { ExhibitionFormData, ExhibitionCategory, VenueType, MeasurementUnit, EventType } from '@/types/exhibition-management';
import { useIndianStates, useIndianCities } from '@/services/locationService';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string()
    .min(6, 'Postal code must be 6 digits')
    .max(6, 'Postal code must be 6 digits')
    .regex(/^\d+$/, 'Postal code must contain only digits'),
  organiser_id: z.string(),
  status: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  category_id: z.string().min(1, 'Category is required'),
  venue_type_id: z.string().min(1, 'Venue type is required'),
  event_type_id: z.string().min(1, 'Event type is required'),
  measuring_unit_id: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export interface ExhibitionFormProps {
  onSubmit: (data: ExhibitionFormData) => Promise<void>;
  categories: ExhibitionCategory[];
  venueTypes: VenueType[];
  eventTypes: EventType[];
  measuringUnits: MeasurementUnit[];
  isLoading: boolean;
  initialData?: ExhibitionFormData;
}

const ExhibitionForm: React.FC<ExhibitionFormProps> = ({ 
  onSubmit, 
  categories, 
  venueTypes,
  eventTypes,
  measuringUnits,
  isLoading,
  initialData 
}) => {
  const { states, loading: loadingStates, error: statesError } = useIndianStates();
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');
  const { cities, loading: loadingCities, error: citiesError } = useIndianCities(selectedStateCode);

  console.log('Event types in form:', eventTypes);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postal_code: '',
      organiser_id: '',
      status: 'draft',
      start_date: '',
      end_date: '',
      start_time: '11:00',
      end_time: '17:00',
      category_id: '',
      venue_type_id: '',
      event_type_id: '',
      measuring_unit_id: ''
    }
  });

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('Setting form initial data:', {
        initialData,
        venue_type_id: initialData.venue_type_id,
        event_type_id: initialData.event_type_id
      });

      // Find state code for the initial state
      const stateData = states.find(s => s.name === initialData.state);
      if (stateData) {
        setSelectedStateCode(stateData.state_code);
      }

      form.reset({
        title: initialData.title,
        description: initialData.description,
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        country: 'India',
        postal_code: initialData.postal_code || '',
        organiser_id: initialData.organiser_id,
        status: initialData.status,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        start_time: initialData.start_time || '11:00',
        end_time: initialData.end_time || '17:00',
        category_id: initialData.category_id || '',
        venue_type_id: initialData.venue_type_id || '',
        event_type_id: initialData.event_type_id || '',
        measuring_unit_id: initialData.measuring_unit_id || ''
      });
    } else {
      // Set default country for new forms
      form.setValue('country', 'India');
    }
  }, [initialData, form, states]);

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data as ExhibitionFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Exhibition title" {...field} />
              </FormControl>
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
                <Textarea placeholder="Exhibition description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      const state = states.find(s => s.state_code === value);
                      if (state) {
                        field.onChange(state.name);
                        setSelectedStateCode(value);
                        // Reset city when state changes
                        form.setValue('city', '');
                      }
                    }} 
                    value={states.find(s => s.name === field.value)?.state_code || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {loadingStates ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            states.find(s => s.name === field.value)?.name || "Select state"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.state_code} value={state.state_code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statesError && <p className="text-sm text-red-500">{statesError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                    disabled={!selectedStateCode || loadingCities}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {loadingCities ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            field.value || "Select city"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {citiesError && <p className="text-sm text-red-500">{citiesError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input value="India" disabled {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-digit postal code" 
                      maxLength={6}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
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
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) =>
                        date < new Date(form.getValues("start_date"))
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Opening Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <p className="text-sm text-muted-foreground">Time when exhibition opens each day</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Closing Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <p className="text-sm text-muted-foreground">Time when exhibition closes each day</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="event_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="venue_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {venueTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Exhibition' : 'Create Exhibition'}
        </Button>
      </form>
    </Form>
  );
};

export default ExhibitionForm;
