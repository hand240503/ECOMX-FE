import { useEffect } from 'react';
import MainHeader from '../layout/header/MainHeader';
import MainFooter from '../layout/footer/MainFooter';
import BannerSlider from '../components/home/BannerSlider';
import HomePromoProductSections from '../components/home/HomePromoProductSections';
import QuickLinks from '../components/home/QuickLinks';
import ProductFeed from '../components/home/ProductFeed';
import { ServiceHighlights } from '../components/home/ServiceHighlights';
import { useRouteLoadingState } from '../app/loading/RouteLoadingProvider';
import { useHomeBootstrap } from '../hooks/useHomeBootstrap';
import { useI18n } from '../i18n/I18nProvider';
import { aggregateCollectorDedupEvents } from '../lib/collectorBehavior';

const HomePage = () => {
  const { t } = useI18n();
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
          <BannerSlider />
          <QuickLinks />
          <HomePromoProductSections />
          <ProductFeed title={t('home_for_you_title')} />
          <ServiceHighlights />
        </div>
      </main>

      <MainFooter />
    </div>
  );
};

export default HomePage;
