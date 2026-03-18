import { useEffect, useState } from 'react';
import slider2 from '../../assets/sliders/slider_2.webp';
import slider4 from '../../assets/sliders/slider_4.webp';
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
    }, 3500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[currentSlide];

  return (
    <section className="mb-4">
      <div className="group w-full relative rounded-lg overflow-hidden h-[420px] bg-gray-100">
        {slides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.image}
            onClick={() => window.open(slide.url, '_blank')}
            alt={`banner-${slide.id}`}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ease-in-out
              ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
          />
        ))}

        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 p-2 rounded-full text-gray-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white transition-opacity"
          aria-label="Slide truoc"
        >
          &#8249;
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 p-2 rounded-full text-gray-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white transition-opacity"
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
