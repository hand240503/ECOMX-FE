import { useEffect } from 'react';
import MainHeader from '../layout/header/MainHeader';
import MainFooter from '../layout/footer/MainFooter';
import Sidebar from '../components/home/Sidebar';
import BannerSlider from '../components/home/BannerSlider';
import QuickLinks from '../components/home/QuickLinks';
import ProductFeed from '../components/home/ProductFeed';
import { useRouteLoadingState } from '../app/loading/RouteLoadingProvider';
import { useHomeBootstrap } from '../hooks/useHomeBootstrap';

const HomePage = () => {
  const { isBootstrapping } = useHomeBootstrap();
  const { setPageBlockingLoading } = useRouteLoadingState();

  useEffect(() => {
    setPageBlockingLoading(isBootstrapping);
    return () => setPageBlockingLoading(false);
  }, [isBootstrapping, setPageBlockingLoading]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />

      <main className="flex-1 py-4">
        <div className="mx-auto w-full max-w-container px-4 tablet:px-6">
          <div className="flex gap-4 desktop:gap-6">
            <div className="hidden w-[240px] flex-shrink-0 desktop:block">
              <Sidebar />
            </div>

            <div className="min-w-0 flex-1">
              <BannerSlider />
              <QuickLinks />
              <ProductFeed />
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
};

export default HomePage;
