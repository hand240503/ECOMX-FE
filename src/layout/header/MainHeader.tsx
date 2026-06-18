import { useQuery } from '@tanstack/react-query';
import { Loader2, SlidersHorizontal, MoreHorizontal, ChevronDown } from 'lucide-react';
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
import { cn } from '../../lib/cn';
import { useCart } from '../../app/cart/CartProvider';
import { NotificationBell } from '../../components/notification/NotificationBell';

const HEADER_SEARCH_SUGGEST_DEBOUNCE_MS = 1000;
const HEADER_SEARCH_SUGGEST_LIMIT = 5;

const formatSuggestPrice = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

/* ── Nav items cố định ── */
const NAV_ITEMS = [
  { label: 'Trang chủ',           path: '/',                                      exact: true  },
  { label: 'Laptop',              path: '/products?category=LAPTOP',              exact: false },
  { label: 'Điện thoại',          path: '/products?category=SMARTPHONE',          exact: false },
  { label: 'Tablet',              path: '/products?category=TABLET',              exact: false },
  { label: 'Gaming',              path: '/products?category=GAMING',              exact: false },
  { label: 'Phụ kiện',            path: '/products?category=ACCESSORIES',         exact: false },
  { label: 'Đồng hồ thông minh',  path: '/products?category=SMARTWATCH',          exact: false },
  { label: 'Ưu đãi hot',          path: '/products/hot-sale',                     exact: false },
];

const MainHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const langWrapperRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [overlayTop, setOverlayTop] = useState(0);

  const { isTopLoadingBarVisible, navigateWithLoading, startRouteTransition } = useRouteLoadingNavigation();
  const location = useLocation();

  const debouncedSearchQuery = useDebouncedValue(searchQuery, HEADER_SEARCH_SUGGEST_DEBOUNCE_MS);
  const debouncedTrim = debouncedSearchQuery.trim();
  const typingTrim = searchQuery.trim();
  const isWaitingDebounce = isSearchOpen && typingTrim.length > 0 && typingTrim !== debouncedTrim;

  const headerSuggestQuery = useQuery({
    queryKey: ['products', 'search', 'header-suggest', debouncedTrim, HEADER_SEARCH_SUGGEST_LIMIT],
    queryFn: ({ signal }) =>
      productService.search({ q: debouncedTrim, page: 0, limit: HEADER_SEARCH_SUGGEST_LIMIT, signal }),
    enabled: isSearchOpen && debouncedTrim.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { lang, setLang, t } = useI18n();
  const { totalQuantity: cartCount } = useCart();

  const langOptions: { value: Lang; label: string; flag: string }[] = [
    { value: 'vi', label: t('lang_vi'), flag: flagVi },
    { value: 'en', label: t('lang_en'), flag: flagEn },
  ];
  const currentLang = langOptions.find((item) => item.value === lang) ?? langOptions[0];

  const { user, isAuthenticated } = useAuth();
  const userBadge = buildUserBadge(
    { fullName: user?.userInfo?.fullName, email: user?.email, avatar: user?.userInfo?.avatar },
    t('header_account')
  );

  /* ── Close on outside click ── */
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(target)) setIsSearchOpen(false);
      if (langWrapperRef.current && !langWrapperRef.current.contains(target)) setIsLangOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  /* ── Overlay top ── */
  useEffect(() => {
    const update = () => {
      if (!headerRef.current) return;
      setOverlayTop(headerRef.current.getBoundingClientRect().bottom);
    };
    if (isSearchOpen) {
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [isSearchOpen]);

  /* ── Sync search query on /search ── */
  useEffect(() => {
    if (location.pathname !== '/search') return;
    const q = new URLSearchParams(location.search).get('q');
    setSearchQuery(decodeSearchQuery(q));
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    await authService.logout();
    navigateWithLoading('/login');
  };

  const submitSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) pushSearchHistory(trimmed);
    setIsSearchOpen(false);
    navigateWithLoading({ pathname: '/search', search: trimmed ? `?q=${encodeURIComponent(trimmed)}` : '' });
  };

  const pickSuggestedProduct = (productName: string) => {
    const name = productName.trim();
    if (!name) return;
    setSearchQuery(name);
    pushSearchHistory(name);
    setIsSearchOpen(false);
    navigateWithLoading({ pathname: '/search', search: `?q=${encodeURIComponent(name)}` });
  };

  /* ── Active nav ── */
  const isNavActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.exact) return location.pathname === item.path;
    const [p, qs] = item.path.split('?');
    if (location.pathname !== p) return false;
    if (!qs) return true;
    const params = new URLSearchParams(qs);
    const current = new URLSearchParams(location.search);
    return [...params.entries()].every(([k, v]) => current.get(k) === v);
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
    >
      {/* ══ ROW 1: Logo | Search | Actions ══ */}
      <div className="mx-auto flex w-full max-w-container items-center gap-3 px-4 py-2.5 tablet:px-6">

        {/* Logo */}
        <button
          type="button"
          onClick={() => navigateWithLoading('/')}
          className="flex-shrink-0 flex items-center outline-none focus:outline-none"
          aria-label="Trang chủ"
        >
          <span className="text-[22px] font-black leading-none tracking-tight">
            <span className="text-danger">E</span>
            <span className="text-gray-900">com</span>
            <span className="text-danger">X</span>
          </span>
        </button>

        {/* Search bar */}
        <div ref={searchWrapperRef} className="relative flex-1 min-w-0">
          <div
            className={cn(
              'flex items-center h-9 rounded-full border bg-[#F5F7FA] px-3 gap-2 transition-all',
              isSearchOpen ? 'border-danger/50 ring-2 ring-danger/10' : 'border-border hover:border-gray-300'
            )}
          >
            {/* Search icon */}
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>

            {/* Input */}
            <input
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
                if (e.key === 'Enter') { e.preventDefault(); submitSearch(); }
              }}
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none border-none placeholder:text-gray-400 focus:outline-none focus:ring-0 min-w-0"
            />

            {/* Filter icon */}
            <button
              type="button"
              onClick={submitSearch}
              className="flex-shrink-0 text-gray-400 hover:text-danger transition-colors outline-none focus:outline-none"
              aria-label="Lọc"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Search dropdown */}
          {isSearchOpen && (
            <div
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[360px] overflow-hidden rounded-xl border border-border bg-white shadow-xl"
              role="listbox"
              aria-label={t('header_search_suggestions_title')}
            >
              <div className="flex max-h-[360px] flex-col overflow-y-auto">
                <div className="sticky top-0 border-b border-border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                    {t('header_search_suggestions_title')}
                  </p>
                </div>

                {isWaitingDebounce && (
                  <div className="flex items-center gap-2 px-3 py-6 text-caption text-text-secondary">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-danger" aria-hidden />
                    {t('header_search_suggestions_waiting')}
                  </div>
                )}

                {!isWaitingDebounce && debouncedTrim.length > 0 && headerSuggestQuery.isLoading && (
                  <div className="space-y-2 px-3 py-3">
                    {Array.from({ length: HEADER_SEARCH_SUGGEST_LIMIT }).map((_, i) => (
                      <div key={i} className="flex animate-pulse gap-3 rounded-md border border-border p-2">
                        <div className="h-12 w-12 shrink-0 rounded bg-border" />
                        <div className="flex flex-1 flex-col justify-center gap-2">
                          <div className="h-3 w-[80%] rounded bg-border" />
                          <div className="h-3 w-1/3 rounded bg-border" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isWaitingDebounce && debouncedTrim.length > 0 && !headerSuggestQuery.isLoading && headerSuggestQuery.isError && (
                  <p className="px-3 py-6 text-center text-caption text-text-secondary">{t('header_search_suggestions_error')}</p>
                )}

                {!isWaitingDebounce && debouncedTrim.length > 0 && !headerSuggestQuery.isLoading && !headerSuggestQuery.isError &&
                  (headerSuggestQuery.data?.products?.length ?? 0) === 0 && (
                    <p className="px-3 py-6 text-center text-caption text-text-secondary">{t('header_search_suggestions_empty')}</p>
                  )}

                {!isWaitingDebounce && debouncedTrim.length > 0 && !headerSuggestQuery.isLoading && !headerSuggestQuery.isError &&
                  (headerSuggestQuery.data?.products?.length ?? 0) > 0 &&
                  headerSuggestQuery.data!.products.slice(0, HEADER_SEARCH_SUGGEST_LIMIT).map((p) => {
                    const card = mapProductFullToCard(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestedProduct(card.name)}
                        className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#F5F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-danger"
                      >
                        <img src={card.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm text-gray-800">{card.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-danger">
                            {card.priceIsFrom && <span className="font-normal text-text-secondary">{t('product_price_from_prefix')}</span>}
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

        {/* ── Action icons ── */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Bell — thông báo */}
          <NotificationBell />

          {/* Cart */}
          <button
            type="button"
            onClick={() => navigateWithLoading('/cart')}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors outline-none focus:outline-none"
            aria-label={t('header_cart_aria')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* User / Login */}
          {isAuthenticated ? (
            <div
              className="relative"
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => navigateWithLoading('/account')}
                className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-gray-600 hover:bg-gray-100 transition-colors outline-none focus:outline-none"
              >
                {userBadge.avatarUrl ? (
                  <img src={userBadge.avatarUrl} alt={userBadge.label} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/10 text-[10px] font-bold text-danger">
                    {userBadge.initial}
                  </span>
                )}
                <span className="hidden text-sm font-medium xl:block max-w-[100px] truncate">{userBadge.label}</span>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full pt-1 z-50">
                  <div className="w-48 rounded-xl bg-white border border-border shadow-lg overflow-hidden">
                    <button type="button" onClick={() => navigateWithLoading('/account')} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">{t('header_my_account')}</button>
                    <button type="button" onClick={() => navigateWithLoading('/orders')} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">{t('header_orders')}</button>
                    <button type="button" onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-red-50">{t('header_logout')}</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigateWithLoading('/login')}
              className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-gray-600 hover:bg-gray-100 transition-colors outline-none focus:outline-none"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden text-sm font-medium xl:block">{t('header_account')}</span>
            </button>
          )}

          {/* Language picker */}
          <div ref={langWrapperRef} className="relative">
            <button
              type="button"
              onClick={() => setIsLangOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors outline-none focus:outline-none"
              aria-label={t('lang_label')}
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-44 rounded-xl bg-white shadow-lg border border-border z-50 overflow-hidden">
                {langOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setIsLangOpen(false);
                      if (item.value === lang) return;
                      startRouteTransition(() => setLang(item.value), 450);
                    }}
                    className={cn(
                      'w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm',
                      lang === item.value ? 'text-danger font-medium' : 'text-gray-700'
                    )}
                  >
                    <img src={item.flag} alt={item.label} className="w-5 h-3.5 object-cover rounded-sm" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ ROW 2: Navigation bar ══ */}
      <div className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-container items-center px-4 tablet:px-6">
          <nav className="flex flex-1 items-center gap-0 overflow-x-auto scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigateWithLoading(item.path)}
                  className={cn(
                    'relative flex-shrink-0 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition-colors outline-none focus:outline-none',
                    active
                      ? 'text-danger after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-danger after:content-[""]'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Xem tất cả danh mục */}
          <button
            type="button"
            onClick={() => navigateWithLoading('/products')}
            className="ml-auto flex flex-shrink-0 items-center gap-1 whitespace-nowrap py-2.5 pl-3 text-[13px] font-medium text-danger outline-none focus:outline-none hover:text-danger/80 transition-colors"
          >
            Xem tất cả danh mục
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Loading bar */}
      {isTopLoadingBarVisible && (
        <div className="profile-top-loading" aria-hidden="true">
          <div className="profile-top-loading__bar" />
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 bg-black/40 z-30"
          style={{ top: overlayTop }}
          onClick={() => setIsSearchOpen(false)}
        />
      )}
    </header>
  );
};

export default MainHeader;
