import MainHeader from '../layout/header/MainHeader';
import MainFooter from '../layout/footer/MainFooter';
import Sidebar from '../components/home/Sidebar';
import BannerSlider from '../components/home/BannerSlider';
import QuickLinks from '../components/home/QuickLinks';
import ProductFeed from '../components/home/ProductFeed';

const HomePage = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <MainHeader cartCount={5} />

      <main className="w-full max-w-[1392px] mx-auto py-4 flex-1">
        <div className="flex gap-6">
          <div className="hidden lg:block w-[230px] flex-shrink-0">
            <Sidebar />
          </div>

          <div className="flex-1 min-w-0">
            <BannerSlider />
            <QuickLinks />
            <ProductFeed />
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
};

export default HomePage;
