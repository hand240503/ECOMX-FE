import { useEffect } from 'react';
import MainHeader from '../layout/header/MainHeader';
import MainFooter from '../layout/footer/MainFooter';
import BannerSlider from '../components/home/BannerSlider';
import HomePromoProductSections from '../components/home/HomePromoProductSections';
import MiniBanners from '../components/home/MiniBanners';
import ProductFeed from '../components/home/ProductFeed';
import { ServiceHighlights } from '../components/home/ServiceHighlights';
import HomeCategorySidebar from '../components/home/HomeCategorySidebar';
import HomeCategoryRow from '../components/home/HomeCategoryRow';
import HomeFlashSale from '../components/home/HomeFlashSale';
import HomeRightPanel from '../components/home/HomeRightPanel';
import { useRouteLoadingState } from '../app/loading/RouteLoadingProvider';
import { useHomeBootstrap } from '../hooks/useHomeBootstrap';
import { aggregateCollectorDedupEvents } from '../lib/collectorBehavior';

const HomePage = () => {
  const { isBootstrapping } = useHomeBootstrap();
  const { setPageBlockingLoading } = useRouteLoadingState();

  useEffect(() => {
    setPageBlockingLoading(isBootstrapping);
    return () => setPageBlockingLoading(false);
  }, [isBootstrapping, setPageBlockingLoading]);

  useEffect(() => {
    const aggregated = aggregateCollectorDedupEvents();
    console.log('[collector] aggregateCollectorDedupEvents (home)', aggregated);
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <MainHeader />

      <main className="flex-1 py-4">
        <div className="mx-auto w-full max-w-container px-4 tablet:px-6">

          {/* Hero zone: sidebar | banner + mini banners | right panel */}
          <div className="flex gap-3 mb-4 items-stretch">
            {/* Left sidebar — chỉ hiển thị desktop trở lên */}
            <div className="hidden desktop:flex">
              <HomeCategorySidebar />
            </div>

            {/* Center column — banner trên, 3 mini banner fill phần còn lại */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <BannerSlider />
              <MiniBanners />
            </div>

            {/* Right panel — chỉ hiển thị wide trở lên */}
            <div className="hidden wide:flex">
              <HomeRightPanel />
            </div>
          </div>

          {/* Danh mục nổi bật — icon row ngang */}
          <HomeCategoryRow />

          {/* Ưu đãi ngập tràng / Hot Sale / Nổi bật */}
          <HomePromoProductSections />

          {/* Flash Sale */}
          <HomeFlashSale />

          {/* Sản phẩm nổi bật — dùng ProductFeed với ProductCard đầy đủ */}
          <ProductFeed title="Sản phẩm nổi bật" />

          <ServiceHighlights />
        </div>
      </main>

      <MainFooter />
    </div>
  );
};

export default HomePage;
