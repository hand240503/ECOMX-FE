import { useEffect, useState } from 'react';
import slider2 from '../../assets/sliders/slider_1.png';
import slider4 from '../../assets/sliders/slider_2.png';
import slider5 from '../../assets/sliders/slider_5.webp';

const BannerSlider = () => {
  const slides = [
    {
      id: 1,
      image: slider2,
      url: ''
    },
    {
      id: 2,
      image: slider4,
      url: ''
    },
    {
      id: 3,
      image: slider5,
      url: ''
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="mb-4">
      <div className="group relative aspect-[3584/1184] w-full overflow-hidden rounded-md bg-background">
        {slides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.image}
            onClick={() => slide.url && window.open(slide.url, '_blank')}
            alt={`banner-${slide.id}`}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-in-out
              ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}

        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-text-primary opacity-0 transition-opacity duration-200 hover:bg-surface group-hover:pointer-events-auto group-hover:opacity-100"
          aria-label="Slide truoc"
        >
          &#8249;
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-text-primary opacity-0 transition-opacity duration-200 hover:bg-surface group-hover:pointer-events-auto group-hover:opacity-100"
          aria-label="Slide tiep theo"
        >
          &#8250;
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all ${index === currentSlide ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'
                }`}
              aria-label={`Chuyen den slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BannerSlider;
