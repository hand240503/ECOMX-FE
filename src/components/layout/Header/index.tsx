import { useState } from 'react';
import TopBanner from './TopBanner';
import MainHeader from './MainHeader';

const Header = () => {
  const [cartCount] = useState(3);

  return (
    <header className="top-0 z-50 w-full bg-white">
      <TopBanner />
      <MainHeader cartCount={cartCount} />
    </header>
  );
};

export default Header;
