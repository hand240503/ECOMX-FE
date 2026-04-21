import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { productService } from '../../api/services/productService';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useI18n } from '../../i18n/I18nProvider';
import type { Lang } from '../../utils/i18n';
import flagVi from '../../assets/flags/vn.png';
import flagEn from '../../assets/flags/gb.png';
import { useAuth } from '../../app/auth/AuthProvider';
import { buildUserBadge } from '../../domain/user/buildUserBadge';
import { authService } from '../../api/services';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';
import { decodeSearchQuery } from '../../hooks/useSearchUrlState';
import { pushSearchHistory } from '../../lib/searchHistory';
interface MainHeaderProps {
  cartCount?: number;
}

const HEADER_SEARCH_SUGGEST_DEBOUNCE_MS = 1000;
const HEADER_SEARCH_SUGGEST_LIMIT = 5;

const formatSuggestPrice = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

const MainHeader = ({ cartCount = 0 }: MainHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const langWrapperRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [overlayTop, setOverlayTop] = useState(0);
  const { isRouteLoading, navigateWithLoading } = useRouteLoadingNavigation();
  const location = useLocation();
  const debouncedSearchQuery = useDebouncedValue(searchQuery, HEADER_SEARCH_SUGGEST_DEBOUNCE_MS);
  const debouncedTrim = debouncedSearchQuery.trim();
  const typingTrim = searchQuery.trim();
  const isWaitingDebounce =
    isSearchOpen && typingTrim.length > 0 && typingTrim !== debouncedTrim;

  const headerSuggestQuery = useQuery({
    queryKey: ['products', 'search', 'header-suggest', debouncedTrim, HEADER_SEARCH_SUGGEST_LIMIT],
    queryFn: ({ signal }) =>
      productService.search({
        q: debouncedTrim,
        page: 0,
        limit: HEADER_SEARCH_SUGGEST_LIMIT,
        signal,
      }),
    enabled: isSearchOpen && debouncedTrim.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { lang, setLang, t } = useI18n();
  const langOptions: { value: Lang; label: string; flag: string }[] = [
    { value: 'vi', label: t('lang_vi'), flag: flagVi },
    { value: 'en', label: t('lang_en'), flag: flagEn }
  ];
  const currentLang = langOptions.find((item) => item.value === lang) ?? langOptions[0];
  const { user, isAuthenticated } = useAuth();
  const userBadge = buildUserBadge(
    {
      fullName: user?.userInfo?.fullName,
      email: user?.email,
      avatar: user?.userInfo?.avatar
    },
    t('header_account')
  );

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (searchWrapperRef.current && !searchWrapperRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (langWrapperRef.current && !langWrapperRef.current.contains(target)) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const updateOverlayTop = () => {
      if (!headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      setOverlayTop(rect.bottom); // theo viewport, dùng cho fixed
    };

    if (isSearchOpen) {
      updateOverlayTop();
      window.addEventListener('resize', updateOverlayTop);
      window.addEventListener('scroll', updateOverlayTop);
    }

    return () => {
      window.removeEventListener('resize', updateOverlayTop);
      window.removeEventListener('scroll', updateOverlayTop);
    };
  }, [isSearchOpen]);

  const handleLogout = async () => {
    await authService.logout();
    navigateWithLoading('/login');
  };

  useEffect(() => {
    if (location.pathname !== '/search') return;
    const q = new URLSearchParams(location.search).get('q');
    setSearchQuery(decodeSearchQuery(q));
  }, [location.pathname, location.search]);

  const submitSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) pushSearchHistory(trimmed);
    setIsSearchOpen(false);
    navigateWithLoading({
      pathname: '/search',
      search: trimmed ? `?q=${encodeURIComponent(trimmed)}` : '',
    });
  };

  const pickSuggestedProduct = (productName: string) => {
    const name = productName.trim();
    if (!name) return;
    setSearchQuery(name);
    pushSearchHistory(name);
    setIsSearchOpen(false);
    navigateWithLoading({
      pathname: '/search',
      search: `?q=${encodeURIComponent(name)}`,
    });
  };

  return (
    <header
      ref={headerRef}
      className="z-40 w-full border-b bg-white shadow-[0_1px_0_rgba(15,23,42,0.06)]"
    >
      <div className="w-full flex justify-center">
        <div className="mx-auto flex w-full max-w-container items-start gap-6 py-3">
          <div onClick={() => navigateWithLoading('/')} className="w-[110px] cursor-pointer flex flex-col items-center justify-center flex-shrink-0">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg px-4 py-2.5 w-full flex justify-center shadow-md hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-2xl leading-none tracking-tight">
                ECOMX
              </span>
            </div>
            <span className="mt-1.5 text-[11px] font-semibold text-gray-600 text-center tracking-wide">
              {t('header_tagline')}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-6">
              <div ref={searchWrapperRef} className="flex-1 relative">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white h-10">
                  <img
                    className="w-5 h-5 ml-4 mr-3"
                    src="https://salt.tikicdn.com/ts/upload/33/d0/37/6fef2e788f00a16dc7d5a1dfc5d0e97a.png"
                    alt="icon-search"
                  />

                  <input
                    data-view-id="main_search_form_input"
                    type="text"
                    placeholder={t('header_search_placeholder')}
                    value={searchQuery}
                    onFocus={() => setIsSearchOpen(true)}
                    onClick={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchQuery(v);
                      if (location.pathname === '/search' && v === '') {
                        navigateWithLoading({ pathname: '/search', search: '' });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitSearch();
                      }
                    }}
                    className="flex-1 h-full text-sm outline-none border-none focus:outline-none focus:ring-0"
                  />

                  <button
                    type="button"
                    data-view-id="main_search_form_button"
                    onClick={() => submitSearch()}
                    className="h-full px-5 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors outline-none focus:outline-none focus:ring-0 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-px before:h-6 before:bg-gray-300"
                  >
                    {t('header_search_button')}
                  </button>
                </div>

                {isSearchOpen && (
                  <div
                    className="absolute left-0 right-0 top-[calc(100%+2px)] z-40 max-h-[360px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                    role="listbox"
                    aria-label={t('header_search_suggestions_title')}
                  >
                    <div className="flex max-h-[360px] flex-col overflow-y-auto">
                      <div className="sticky top-0 border-b border-border bg-surface px-3 py-2">
                        <p className="text-caption font-semibold text-text-primary">
                          {t('header_search_suggestions_title')}
                        </p>
                      </div>

                      {isWaitingDebounce && (
                        <div className="flex items-center gap-2 px-3 py-6 text-caption text-text-secondary">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
                          {t('header_search_suggestions_waiting')}
                        </div>
                      )}

                      {!isWaitingDebounce &&
                        debouncedTrim.length > 0 &&
                        headerSuggestQuery.isLoading && (
                          <div className="space-y-2 px-3 py-3">
                            {Array.from({ length: HEADER_SEARCH_SUGGEST_LIMIT }).map((_, i) => (
                              <div
                                key={i}
                                className="flex animate-pulse gap-3 rounded-md border border-border p-2"
                              >
                                <div className="h-12 w-12 shrink-0 rounded bg-border" />
                                <div className="flex flex-1 flex-col justify-center gap-2">
                                  <div className="h-3 w-[80%] rounded bg-border" />
                                  <div className="h-3 w-1/3 rounded bg-border" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {!isWaitingDebounce &&
                        debouncedTrim.length > 0 &&
                        !headerSuggestQuery.isLoading &&
                        headerSuggestQuery.isError && (
                          <p className="px-3 py-6 text-center text-caption text-text-secondary">
                            {t('header_search_suggestions_error')}
                          </p>
                        )}

                      {!isWaitingDebounce &&
                        debouncedTrim.length > 0 &&
                        !headerSuggestQuery.isLoading &&
                        !headerSuggestQuery.isError &&
                        (headerSuggestQuery.data?.products?.length ?? 0) === 0 && (
                          <p className="px-3 py-6 text-center text-caption text-text-secondary">
                            {t('header_search_suggestions_empty')}
                          </p>
                        )}

                      {!isWaitingDebounce &&
                        debouncedTrim.length > 0 &&
                        !headerSuggestQuery.isLoading &&
                        !headerSuggestQuery.isError &&
                        (headerSuggestQuery.data?.products?.length ?? 0) > 0 &&
                        headerSuggestQuery.data!.products
                          .slice(0, HEADER_SEARCH_SUGGEST_LIMIT)
                          .map((p) => {
                            const card = mapProductFullToCard(p);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                role="option"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickSuggestedProduct(card.name)}
                                className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                              >
                                <img
                                  src={card.image}
                                  alt=""
                                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                                  loading="lazy"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-body text-text-primary">
                                    {card.name}
                                  </p>
                                  <p className="mt-0.5 text-caption font-semibold text-danger">
                                    {formatSuggestPrice(card.price)}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                    </div>
                  </div>
                )}
              </div>

              <div data-view-id="header_user_shortcut" className="flex items-center gap-2">
                <button onClick={() => navigateWithLoading('/')} className="h-10 px-3 flex items-center gap-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors outline-none focus:outline-none focus:ring-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                  <span className="text-sm font-medium hidden xl:block">{t('header_home')}</span>
                </button>
                <button className="relative h-10 px-3 flex items-center gap-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 outline-none focus:outline-none focus:ring-0 group">
                  <div className="relative">
                    <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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


                <div ref={langWrapperRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLangOpen((prev) => !prev)}
                    className="h-10 px-2 rounded-lg bg-white hover:bg-blue-50 transition-colors flex items-center gap-2 outline-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label={t('lang_label')}
                  >
                    <img
                      src={currentLang.flag}
                      alt={currentLang.label}
                      className="w-6 h-4 object-cover rounded-sm"
                    />
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isLangOpen && (
                    <div className="absolute right-0 top-[calc(100%+6px)] w-44 rounded-lg bg-white shadow-lg z-50 overflow-hidden">
                      {langOptions.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setLang(item.value);
                            setIsLangOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-blue-50 transition-colors ${lang === item.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                        >
                          <img
                            src={item.flag}
                            alt={item.label}
                            className="w-6 h-4 object-cover rounded-sm"
                          />
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>


                {isAuthenticated ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setIsUserMenuOpen(true)}
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <button
                      onClick={() => navigateWithLoading('/account')}
                      className="h-10 px-3 flex items-center gap-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors outline-none focus:outline-none focus:ring-0 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-px before:h-6 before:bg-gray-300"
                    >
                      {userBadge.avatarUrl ? (
                        <img
                          src={userBadge.avatarUrl}
                          alt={userBadge.label}
                          className="w-7 h-7 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center border border-blue-200">
                          {userBadge.initial}
                        </span>
                      )}
                      <span className="text-sm font-medium hidden xl:block max-w-[140px] truncate">
                        {userBadge.label}
                      </span>
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full pt-2 z-50">
                        <div className="w-52 rounded-lg bg-white border border-gray-200 shadow-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => navigateWithLoading('/account')}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50"
                          >
                            Tài khoản của tôi
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateWithLoading('/orders')}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50"
                          >
                            Đơn hàng
                          </button>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => navigateWithLoading('/login')}
                    className="h-10 px-3 flex items-center gap-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors outline-none focus:outline-none focus:ring-0 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-px before:h-6 before:bg-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium hidden xl:block">{t('header_account')}</span>
                  </button>)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-sm text-gray-600">{t('header_delivery_to')}</span>
              <button className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors underline outline-none focus:outline-none focus:ring-0 group">
                {t('header_delivery_prompt')}
              </button>
            </div>
          </div>
        </div>
      </div >
      {isRouteLoading && (
        <div className="profile-top-loading" aria-hidden="true">
          <div className="profile-top-loading__bar" />
        </div>
      )}

      {
        isSearchOpen && (
          <div
            className="fixed left-0 right-0 bottom-0 bg-black/40 z-30"
            style={{ top: overlayTop }}
            onClick={() => setIsSearchOpen(false)}
          />
        )
      }
    </header >
  );
};

export default MainHeader;
