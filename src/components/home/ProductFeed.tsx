import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';
import ProductSkeleton from '../product/ProductSkeleton';

interface ProductItem {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  soldCount: number;
  image: string;
  location: string;
}

const ProductFeed = () => {
  const [isLoading, setIsLoading] = useState(true);
  const productImage =
    'https://imgs.search.brave.com/QWn9eSw92TtJj83f1XXsMGkdATu7xnxRdAd3VKXopm8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmVi/YXlpbWcuY29tL2lt/YWdlcy9nLzdEa0FB/T1N3dmdkbGZDR0Ev/cy1sOTYwLndlYnA';

  const products: ProductItem[] = [
    { id: 1, name: 'iPhone 15 128GB - Man Super Retina XDR, chip A16 Bionic', price: 19990000, originalPrice: 22990000, discountPercent: 13, rating: 4.9, soldCount: 1240, image: productImage, location: 'Ho Chi Minh' },
    { id: 2, name: 'Samsung Galaxy S24 256GB - Camera AI, man hinh 120Hz', price: 17990000, originalPrice: 20990000, discountPercent: 14, rating: 4.8, soldCount: 980, image: productImage, location: 'Dong Nai' },
    { id: 3, name: 'Laptop ASUS Vivobook 15 - Intel Core i5, RAM 16GB, SSD 512GB', price: 15990000, originalPrice: 18990000, discountPercent: 16, rating: 4.8, soldCount: 715, image: productImage, location: 'Ha Noi' },
    { id: 4, name: 'MacBook Air M2 13-inch - RAM 8GB, SSD 256GB', price: 23990000, originalPrice: 26990000, discountPercent: 11, rating: 4.6, soldCount: 502, image: productImage, location: 'Binh Duong' },
    { id: 5, name: 'Tai nghe Sony WH-1000XM5 chong on chu dong', price: 7990000, originalPrice: 9990000, discountPercent: 20, rating: 4.8, soldCount: 1334, image: productImage, location: 'Da Nang' },
    { id: 6, name: 'Loa Bluetooth JBL Charge 5 - Pin 20 gio, chong nuoc IP67', price: 3190000, originalPrice: 3990000, discountPercent: 20, rating: 4.9, soldCount: 889, image: productImage, location: 'Ho Chi Minh' },
    { id: 7, name: 'Man hinh LG UltraGear 27 inch QHD 165Hz', price: 6890000, originalPrice: 7990000, discountPercent: 14, rating: 4.5, soldCount: 644, image: productImage, location: 'Nam Dinh' },
    { id: 8, name: 'Ban phim co Logitech G Pro X TKL Lightspeed', price: 3590000, originalPrice: 4290000, discountPercent: 16, rating: 4.9, soldCount: 773, image: productImage, location: 'Ha Noi' },
    { id: 9, name: 'Chuot gaming Razer DeathAdder V3 Pro Wireless', price: 2690000, originalPrice: 3290000, discountPercent: 18, rating: 4.7, soldCount: 1212, image: productImage, location: 'Long An' },
    { id: 10, name: 'Apple Watch Series 9 GPS 45mm - Man Always-On Retina', price: 9990000, originalPrice: 11990000, discountPercent: 17, rating: 4.8, soldCount: 561, image: productImage, location: 'TP. HCM' },
    { id: 11, name: 'Router Wi-Fi 6 TP-Link AX3000 phu song manh', price: 1890000, originalPrice: 2290000, discountPercent: 17, rating: 4.6, soldCount: 936, image: productImage, location: 'Can Tho' },
    { id: 12, name: 'SSD Samsung 980 PRO 1TB NVMe PCIe 4.0', price: 2390000, originalPrice: 2890000, discountPercent: 17, rating: 4.7, soldCount: 1487, image: productImage, location: 'Ha Noi' }
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="mt-4 bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg text-gray-900">Deal Công Nghệ Nổi Bật</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => (
            <ProductSkeleton key={`product-skeleton-${index}`} />
          ))
          : products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              image={product.image}
              price={product.price}
              originalPrice={product.originalPrice}
              discountPercent={product.discountPercent}
              rating={product.rating}
              soldCount={product.soldCount}
              location={product.location}
            />
          ))}
      </div>
      <div className="flex justify-center py-6">
        <button className="bg-white border border-blue-500 text-blue-600 px-12 py-2 rounded-md hover:bg-blue-50 transition-colors">
          Xem them
        </button>
      </div>
    </section>
  );
};

export default ProductFeed;
