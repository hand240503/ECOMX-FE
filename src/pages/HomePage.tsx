import MainHeader from '../layout/header/MainHeader';
import MainFooter from '../layout/footer/MainFooter';
import Sidebar from '../components/home/Sidebar';
import BannerSlider from '../components/home/BannerSlider';
import QuickLinks from '../components/home/QuickLinks';
import ProductFeed from '../components/home/ProductFeed';

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader cartCount={5} />

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
