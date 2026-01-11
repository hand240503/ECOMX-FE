import MainHeader from '../../components/layout/Header/MainHeader';

const HomePage = () => {
  return (
    <div>
      <MainHeader cartCount={5} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Chào mừng đến ECOMX</h1>
        <p className="text-gray-600">Trang chủ của bạn</p>
      </main>
    </div>
  );
};

export default HomePage;