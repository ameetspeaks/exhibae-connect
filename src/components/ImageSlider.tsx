import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import 'swiper/css';
import 'swiper/css/effect-fade';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface HeroSlider {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
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

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_sliders')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        if (error) throw error;
        setSliders(data || []);
        onStatusChange({ loading: false, hasSlides: (data || []).length > 0 });
      } catch (error) {
        console.error('Error fetching sliders:', error);
        onStatusChange({ loading: false, hasSlides: false });
      } finally {
        setLoading(false);
      }
    };

    fetchSliders();
  }, [supabase, onStatusChange]);

  // Return null while loading or if no sliders
  if (loading || sliders.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[500px] max-w-6xl mx-auto px-4">
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
        {sliders.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              <img
                src={slide.image_url}
                alt={slide.title || 'Exhibition background'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-background mb-4 header-text max-w-3xl">
                  {slide.title}
                </h2>
                {slide.description && (
                  <p className="text-lg md:text-xl text-background/90 mb-6 subheading-text max-w-2xl">
                    {slide.description}
                  </p>
                )}
                {slide.link_url && (
                  <Button 
                    asChild
                    className="bg-[#E6C5B6] hover:bg-opacity-90 text-font-color px-6 py-2 text-base subheading-text"
                  >
                    <Link to={slide.link_url}>Learn More</Link>
                  </Button>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSlider; 