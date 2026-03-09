import { useEffect, useState } from 'react';

const BannerSlider = () => {
  const slides = [
    {
      id: 1,
      title: 'SIÊU DEAL CÔNG NGHỆ',
      subtitle: 'Laptop, điện thoại, phụ kiện giảm đến 40%',
      highlight: 'TRẢ GÓP 0% - FREESHIP TOÀN QUỐC',
      gradient: 'from-blue-600 to-blue-400'
    },
    {
      id: 2,
      title: 'TUẦN LỆ LAPTOP',
      subtitle: 'Nâng cấp cấu hình học tập và làm việc giá tốt',
      highlight: 'ƯU ĐÃI ĐẾN 5 TRIỆU',
      gradient: 'from-violet-600 to-indigo-500'
    },
    {
      id: 3,
      title: 'KHUYẾN MÃI PHỤ KIỆN',
      subtitle: 'Tai nghe, ban phím, chuột gaming sale mỗi ngày',
      highlight: 'MUA 2 GIAM THEM 10%',
      gradient: 'from-cyan-600 to-sky-500'
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
      <div className="group w-full relative rounded-lg overflow-hidden h-[220px] md:h-[300px] flex items-center justify-center text-white">
        <div className={`absolute inset-0 bg-gradient-to-r ${activeSlide.gradient}`}></div>
        <div className="relative z-10 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">{activeSlide.title}</h2>
          <p className="text-base md:text-xl">{activeSlide.subtitle}</p>
          <p className="mt-4 text-2xl md:text-3xl font-bold text-yellow-300">{activeSlide.highlight}</p>
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 p-2 rounded-full text-gray-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white transition-opacity"
          aria-label="Slide truoc"
        >
          &#8249;
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 p-2 rounded-full text-gray-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white transition-opacity"
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
