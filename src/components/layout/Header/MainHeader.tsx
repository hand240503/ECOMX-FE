import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
interface MainHeaderProps {
  cartCount?: number;
}

const MainHeader = ({ cartCount = 0 }: MainHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  return (
    <header className="w-full bg-white border-b">
      {/* FULL WIDTH */}
      <div className="w-full flex justify-center">
        {/* CONTENT */}
        <div className="w-[1392px] px-6 py-3 flex items-start gap-6">

          {/* LOGO */}
          <div className="w-[110px] flex flex-col items-center justify-center flex-shrink-0">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg px-4 py-2.5 w-full flex justify-center shadow-md hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-2xl leading-none tracking-tight">
                ECOMX
              </span>
            </div>
            <span className="mt-1.5 text-[11px] font-semibold text-gray-600 text-center tracking-wide">
              Fast &amp; Easy
            </span>
          </div>

          {/* RIGHT SIDE - 2 LEVELS */}
          <div className="flex-1 flex flex-col gap-3">

            {/* LEVEL 1: SEARCH + USER SHORTCUT */}
            <div className="flex items-center gap-6">
              {/* SEARCH BAR */}
              <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white h-10">
                <img
                  className="w-5 h-5 ml-4 mr-3"
                  src="https://salt.tikicdn.com/ts/upload/33/d0/37/6fef2e788f00a16dc7d5a1dfc5d0e97a.png"
                  alt="icon-search"
                />

                <input
                  data-view-id="main_search_form_input"
                  type="text"
                  placeholder="Tiki 16 Tuổi - Flash Sale GIẢM HƠN 90%"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-full text-sm outline-none border-none focus:outline-none focus:ring-0"
                />

                <button
                  data-view-id="main_search_form_button"
                  className="h-full px-5 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors outline-none focus:outline-none focus:ring-0 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-px before:h-6 before:bg-gray-300"
                >
                  Tìm kiếm
                </button>
              </div>

              {/* USER SHORTCUT */}
              <div
                data-view-id="header_user_shortcut"
                className="flex items-center gap-2"
              >
                {/* HOME */}
                <button className="h-10 px-3 flex items-center gap-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors outline-none focus:outline-none focus:ring-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                  <span className="text-sm font-medium hidden xl:block">
                    Trang chủ
                  </span>
                </button>

                {/* ACCOUNT */}
                <button onClick={() => navigate('/login')}
                  className="h-10 px-3 flex items-center gap-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors outline-none focus:outline-none focus:ring-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium hidden xl:block">
                    Tài khoản
                  </span>
                </button>

                {/* CART */}
                <button className="relative h-10 px-3 flex items-center gap-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 outline-none focus:outline-none focus:ring-0 group relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-px before:h-6 before:bg-gray-300">
                  <div className="relative">
                    <svg
                      className="w-6 h-6 transition-transform group-hover:scale-110"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>

                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 shadow-lg animate-pulse border-2 border-white">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* LEVEL 2: DELIVERY ADDRESS */}
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-sm text-gray-600">
                Giao hàng đến:
              </span>
              <button className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors underline outline-none focus:outline-none focus:ring-0 group">
                Bạn muốn giao hàng đến đâu?
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;