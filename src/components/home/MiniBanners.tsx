import slider1 from '../../assets/sliders/mini_1.png';
import slider2 from '../../assets/sliders/mini_2.png';
import slider3 from '../../assets/sliders/mini_3.png';

const MINI_BANNERS = [
  { id: 1, image: slider1, url: '' },
  { id: 2, image: slider2, url: '' },
  { id: 3, image: slider3, url: '' }
];

const MiniBanners = () => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MINI_BANNERS.map((banner) => (
        <div
          key={banner.id}
          className="overflow-hidden rounded-md border border-border"
        >
          <img
            src={banner.image}
            alt={`promo-banner-${banner.id}`}
            className="w-full h-auto block"
            loading="lazy"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
};

export default MiniBanners;
