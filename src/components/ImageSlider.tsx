import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import 'swiper/css';
import 'swiper/css/effect-fade';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface HeroSlider {
  id: string;
  title: string | null;
  description: string | null;
  mobile_image_url: string | null;
  desktop_image_url: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
  image_dimensions: {
    mobile: { width: number; height: number };
    desktop: { width: number; height: number };
  };
}

export interface SliderStatus {
  loading: boolean;
  hasSlides: boolean;
}

interface ImageSliderProps {
  onStatusChange: (status: SliderStatus) => void;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ onStatusChange }) => {
  const { supabase } = useSupabase();
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_sliders')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        if (error) throw error;
        
        // Filter sliders based on device type and available images
        const filteredSliders = data?.filter(slider => 
          isMobile ? slider.mobile_image_url : slider.desktop_image_url
        ) || [];
        
        setSliders(filteredSliders);
        onStatusChange({ loading: false, hasSlides: filteredSliders.length > 0 });
      } catch (error) {
        console.error('Error fetching sliders:', error);
        onStatusChange({ loading: false, hasSlides: false });
      } finally {
        setLoading(false);
      }
    };

    fetchSliders();
  }, [supabase, onStatusChange, isMobile]);

  // Return null while loading or if no sliders
  if (loading || sliders.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[400px] md:h-[600px] max-w-7xl mx-auto">
      <Swiper
        modules={[Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="w-full h-full rounded-2xl overflow-hidden shadow-xl"
      >
        {sliders.map((slide) => {
          // Use only the appropriate image for the device type
          const imageUrl = isMobile ? slide.mobile_image_url : slide.desktop_image_url;
          const dimensions = isMobile 
            ? slide.image_dimensions.mobile 
            : slide.image_dimensions.desktop;
          
          // Skip if no appropriate image
          if (!imageUrl) return null;
          
          return (
            <SwiperSlide key={slide.id}>
              <div className="relative w-full h-full">
                <img
                  src={imageUrl}
                  alt={slide.title || 'Exhibition background'}
                  className="w-full h-full object-cover"
                  style={{
                    aspectRatio: `${dimensions.width}/${dimensions.height}`,
                  }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 py-12">
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-background mb-4 sm:mb-6 header-text max-w-4xl">
                    {slide.title}
                  </h2>
                  {slide.description && (
                    <p className="text-lg md:text-2xl text-background/90 mb-6 sm:mb-8 subheading-text max-w-3xl">
                      {slide.description}
                    </p>
                  )}
                  {slide.link_url && (
                    <Button 
                      asChild
                      className="bg-[#E6C5B6] hover:bg-opacity-90 text-font-color px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg subheading-text"
                    >
                      <Link to={slide.link_url}>Learn More</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default ImageSlider; 