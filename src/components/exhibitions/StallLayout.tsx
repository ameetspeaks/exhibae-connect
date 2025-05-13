import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Loader2, AlertCircle, Box } from 'lucide-react';
import { Stall, StallInstance } from '@/types/exhibition-management';
import { useGenerateLayout, useStallInstances } from '@/hooks/useStallsData';
import { useToast } from '@/hooks/use-toast';

interface StallLayoutProps {
  exhibitionId: string;
  stalls: Stall[];
}

const StallLayout: React.FC<StallLayoutProps> = ({ exhibitionId, stalls }) => {
  const { toast } = useToast();
  const { 
    data: stallInstances,
    isLoading: isLoadingInstances,
    error: instancesError
  } = useStallInstances(exhibitionId);
  
  const generateLayoutMutation = useGenerateLayout(exhibitionId);

  // Calculate optimal layout dimensions based on number of stalls
  const { scalingFactor, containerStyle, gridStyle } = useMemo(() => {
    if (!stallInstances || stallInstances.length === 0) {
      return { scalingFactor: 1, containerStyle: {}, gridStyle: {} };
    }
    
    // Calculate grid dimensions based on number of stalls
    const totalStalls = stallInstances.length;
    const aspectRatio = 4/3; // Standard 4:3 aspect ratio for the layout
    const cols = Math.ceil(Math.sqrt(totalStalls * aspectRatio));
    const rows = Math.ceil(totalStalls / cols);
    
    // Target container dimensions (1/4 of original size)
    const containerWidth = 400; // Reduced from 900
    const containerHeight = (containerWidth / aspectRatio);
    
    // Calculate cell size
    const cellWidth = containerWidth / cols;
    const cellHeight = containerHeight / rows;
    const cellSize = Math.min(cellWidth, cellHeight);
    
    // Calculate actual container dimensions
    const actualWidth = cellSize * cols;
    const actualHeight = cellSize * rows;
    
    // Find the maximum stall dimensions for scaling
    const maxStallWidth = Math.max(...stallInstances.map(i => Number(i.stall.width)));
    const maxStallLength = Math.max(...stallInstances.map(i => Number(i.stall.length)));
    
    // Calculate scaling factor to fit stalls in cells
    const scale = (cellSize * 0.85) / Math.max(maxStallWidth, maxStallLength);
    
    return {
      scalingFactor: scale,
      containerStyle: {
        width: `${actualWidth}px`,
        height: `${actualHeight}px`,
        margin: '0 auto',
        position: 'relative' as const,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '2px',
        background: '#1e3a8a', // Darker blue for grid lines
        padding: '2px',
        borderRadius: '4px',
      },
      gridStyle: {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        width: '100%',
        height: '100%',
      }
    };
  }, [stallInstances]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!stalls || stalls.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <Box className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Add stalls to see the layout visualization.</p>
      </div>
        </CardContent>
      </Card>
    );
  }

  const handleGenerateLayout = async () => {
    try {
      await generateLayoutMutation.mutateAsync();
      toast({
        title: "Layout Generated",
        description: "The stall layout has been generated successfully.",
      });
    } catch (error) {
      console.error('Failed to generate layout:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate layout",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div>
          <CardTitle>Layout Preview</CardTitle>
          {stalls.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {stalls.reduce((total, stall) => total + stall.quantity, 0)} total stalls
            </p>
          )}
        </div>
        <Button 
          onClick={handleGenerateLayout}
          disabled={generateLayoutMutation.isPending || stalls.length === 0}
          variant="default"
          className="bg-exhibae-navy hover:bg-exhibae-navy/90"
        >
          {generateLayoutMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Generate Layout
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="border-2 border-dashed rounded-lg p-6 bg-white relative overflow-hidden min-h-[300px] flex items-center justify-center">
          {isLoadingInstances || generateLayoutMutation.isPending ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {generateLayoutMutation.isPending ? 'Generating layout...' : 'Loading stalls...'}
              </p>
            </div>
          ) : instancesError ? (
            <div className="text-center text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading stall instances</p>
            </div>
          ) : !stallInstances || stallInstances.length === 0 ? (
            <div className="text-center">
              <p className="text-muted-foreground text-lg">
                Click "Generate Layout" to create the stall layout
              </p>
            </div>
          ) : (
            <div style={containerStyle}>
              {stallInstances.map((instance) => {
                const stall = instance.stall;
                const isWide = stall.width > stall.length;
                    
                    return (
                  <HoverCard key={instance.id}>
                    <HoverCardTrigger asChild>
                      <div 
                        className="relative bg-white rounded-sm shadow-sm transition-all hover:shadow-md hover:z-10 cursor-pointer m-0.5 overflow-hidden"
                        style={{ 
                          width: `${stall.width * scalingFactor}px`,
                          height: `${stall.length * scalingFactor}px`,
                          minWidth: '30px', // Reduced minimum size
                          minHeight: '30px',
                          border: '2px solid #1e3a8a', // Darker blue border
                        }}
                      >
                        <div 
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(45deg, rgba(30, 58, 138, 0.05) 25%, transparent 25%, transparent 75%, rgba(30, 58, 138, 0.05) 75%, rgba(30, 58, 138, 0.05)), linear-gradient(45deg, rgba(30, 58, 138, 0.05) 25%, transparent 25%, transparent 75%, rgba(30, 58, 138, 0.05) 75%, rgba(30, 58, 138, 0.05))',
                            backgroundSize: '10px 10px',
                            backgroundPosition: '0 0, 5px 5px'
                        }}
                      >
                          <Badge 
                            variant="secondary"
                            className="text-[10px] font-medium bg-white/90 text-exhibae-navy px-1 py-0.5 min-w-[20px] text-center"
                          >
                            {instance.instance_number}
                          </Badge>
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{stall.name}</h4>
                        <div className="text-sm">
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                            <span>Dimensions:</span>
                            <span>{stall.length} × {stall.width} {stall.unit?.abbreviation}</span>
                            <span>Price:</span>
                            <span>{formatPrice(stall.price)}</span>
                            <span>Status:</span>
                            <span className="capitalize">{instance.status}</span>
                            {stall.amenities && stall.amenities.length > 0 && (
                              <>
                                <span>Amenities:</span>
                                <span>{stall.amenities.map(a => a.name).join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                    );
              })}
              </div>
          )}
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Hover over stalls to view detailed information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StallLayout;
