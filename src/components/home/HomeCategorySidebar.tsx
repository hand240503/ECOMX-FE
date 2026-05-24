import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { categoryService } from '../../api/services/categoryService';
import type { BrandSummary, CategoryResponse } from '../../api/types/category.types';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';
import { HOME_PROMO_NAV_ITEMS } from './homePromoNavItems';

// ─── SVG icon imports ─────────────────────────────────────────────────────────
import icMobile      from '../../assets/icon/icon-homepage-mobile.svg';
import icLaptop      from '../../assets/icon/icon-homepage-laptop.svg';
import icTablet      from '../../assets/icon/icon-homepage-tablet.svg';
import icWatch       from '../../assets/icon/icon-homepage-watch.svg';
import icEarphone    from '../../assets/icon/icon-homepage-earphone.svg';
import icSmartHome   from '../../assets/icon/icon-homepage-home-appliances.svg';
import icAccessories from '../../assets/icon/icon-homepage-accessories.svg';
import icMonitor     from '../../assets/icon/icon-homepage-monitor.svg';
import icDesktop     from '../../assets/icon/icon-homepage-desktop.svg';
import icTv          from '../../assets/icon/icon-homepage-tv.svg';
import icStorage     from '../../assets/icon/icon-homepage-storage.svg';
import icCamera      from '../../assets/icon/icon-homepage-camera.svg';
import icGaming      from '../../assets/icon/icon-homepage-gaming.svg';
import icAudio       from '../../assets/icon/icon-homepage-audio-2.svg';
import icAppliance   from '../../assets/icon/icon-homepage-home-appliances.svg';
import icPrinter     from '../../assets/icon/icon-homepage-printer.svg';
import icProjector   from '../../assets/icon/icon-homepage-projector.svg';

/** Map categoryCode → SVG url */
const ICON_MAP: Record<string, string> = {
  SMARTPHONE:  icMobile,
  LAPTOP:      icLaptop,
  TABLET:      icTablet,
  SMARTWATCH:  icWatch,
  EARPHONE:    icEarphone,
  SMART_HOME:  icSmartHome,
  ACCESSORIES: icAccessories,
  MONITOR:     icMonitor,
  DESKTOP:     icDesktop,
  TV:          icTv,
  STORAGE:     icStorage,
  CAMERA:      icCamera,
  GAMING:      icGaming,
  AUDIO:       icAudio,
  APPLIANCE:   icAppliance,
  PRINTER:     icPrinter,
  PROJECTOR:   icProjector,
};

/** Dải giá cố định theo danh mục */
const PRICE_RANGES: Record<string, { label: string; min?: number; max?: number }[]> = {
  SMARTPHONE: [
    { label: 'Dưới 2 triệu', max: 2000000 },
    { label: 'Từ 2 - 4 triệu', min: 2000000, max: 4000000 },
    { label: 'Từ 4 - 7 triệu', min: 4000000, max: 7000000 },
    { label: 'Từ 7 - 13 triệu', min: 7000000, max: 13000000 },
    { label: 'Từ 13 - 20 triệu', min: 13000000, max: 20000000 },
    { label: 'Trên 20 triệu', min: 20000000 },
  ],
  LAPTOP: [
    { label: 'Dưới 10 triệu', max: 10000000 },
    { label: 'Từ 10 - 15 triệu', min: 10000000, max: 15000000 },
    { label: 'Từ 15 - 20 triệu', min: 15000000, max: 20000000 },
    { label: 'Từ 20 - 30 triệu', min: 20000000, max: 30000000 },
    { label: 'Trên 30 triệu', min: 30000000 },
  ],
  TABLET: [
    { label: 'Dưới 5 triệu', max: 5000000 },
    { label: 'Từ 5 - 10 triệu', min: 5000000, max: 10000000 },
    { label: 'Từ 10 - 20 triệu', min: 10000000, max: 20000000 },
    { label: 'Trên 20 triệu', min: 20000000 },
  ],
  SMARTWATCH: [
    { label: 'Dưới 2 triệu', max: 2000000 },
    { label: 'Từ 2 - 5 triệu', min: 2000000, max: 5000000 },
    { label: 'Trên 5 triệu', min: 5000000 },
  ],
};

function buildPriceQuery(range: { min?: number; max?: number }) {
  const params = new URLSearchParams();
  if (range.min != null) params.set('minPrice', String(range.min));
  if (range.max != null) params.set('maxPrice', String(range.max));
  return params.toString() ? `?${params.toString()}` : '';
}

// ─── Mega-menu flyout ─────────────────────────────────────────────────────────

interface MegaMenuProps {
  cat: CategoryResponse;
  children: CategoryResponse[];
  brands: BrandSummary[];
  onNavigate: (path: string) => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  top: number;
  left: number;
}

const MegaMenu = ({ cat, children, brands, onNavigate, onClose, onMouseEnter, onMouseLeave, top, left }: MegaMenuProps) => {
  const priceRanges = PRICE_RANGES[cat.code] ?? [];

  // Chia children thành các nhóm tối đa 3 cột
  const cols = Math.min(3, children.length);
  const colSize = cols > 0 ? Math.ceil(children.length / cols) : 0;
  const columns: CategoryResponse[][] = cols > 0
    ? Array.from({ length: cols }, (_, i) => children.slice(i * colSize, (i + 1) * colSize)).filter((c) => c.length > 0)
    : [];

  const hasBrands = brands.length > 0;
  const hasChildren = children.length > 0;
  const hasPrices = priceRanges.length > 0;

  return (
    <div
      className="fixed z-[200] w-[620px] rounded-r-lg border border-l-0 border-border bg-surface shadow-dropdown overflow-hidden"
      style={{ top, left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div
        className="relative flex items-center justify-between border-b border-border overflow-hidden"
        style={cat.thumbnailUrl ? {} : { background: 'rgb(239 246 255)' }}
      >
        {cat.thumbnailUrl ? (
          <img src={cat.thumbnailUrl} alt={cat.name} className="h-[48px] w-full object-cover" loading="eager" />
        ) : (
          <div className="flex items-center gap-2 px-5 py-3">
            {ICON_MAP[cat.code]
              ? <img src={ICON_MAP[cat.code]} alt={cat.name} className="h-7 w-7 object-contain" />
              : <span className="text-lg">📦</span>
            }
            <span className="text-sm font-bold text-blue-700">{cat.name}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => { onNavigate(`/products?category=${encodeURIComponent(cat.code)}`); onClose(); }}
          className={[
            'absolute right-4 flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors',
            cat.thumbnailUrl ? 'bg-black/40 text-white hover:bg-black/60' : 'text-blue-600 hover:text-blue-700',
          ].join(' ')}
        >
          Xem tất cả <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Brands: logo grid ── */}
        {hasBrands && (
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Thương hiệu
            </p>
            <div className="grid grid-cols-4 gap-2">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  title={brand.name}
                  onClick={() => {
                    onNavigate(`/products?category=${encodeURIComponent(cat.code)}&brand=${encodeURIComponent(brand.code)}`);
                    onClose();
                  }}
                  className="flex h-[46px] items-center justify-center rounded-md border border-border bg-white px-2 transition-all hover:border-blue-400 hover:shadow-sm"
                >
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="max-h-[30px] w-auto max-w-[90px] object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[11px] font-semibold text-text-primary line-clamp-1 px-1">
                      {brand.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Danh mục con ── */}
        {hasChildren && (
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              <span className="inline-block h-2.5 w-0.5 rounded-full bg-blue-400" />
              Danh mục con
            </p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
              {columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-1">
                  {col.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => { onNavigate(`/products?category=${encodeURIComponent(child.code)}`); onClose(); }}
                      className="group flex items-center justify-between gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:border-blue-500 hover:bg-blue-600 hover:text-white hover:shadow-md active:scale-[0.98]"
                    >
                      <span className="line-clamp-1 flex-1">{child.name}</span>
                      <ChevronRight className="h-3 w-3 flex-shrink-0 text-gray-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Mức giá ── */}
        {hasPrices && (
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              <span className="inline-block h-2.5 w-0.5 rounded-full bg-emerald-400" />
              Mức giá
            </p>
            <div className="flex flex-wrap gap-1.5">
              {priceRanges.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => {
                    onNavigate(`/products?category=${encodeURIComponent(cat.code)}${buildPriceQuery(range)}`);
                    onClose();
                  }}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition-all duration-150 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-md active:scale-[0.97]"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Danh sách cứng tên tiếng Việt theo code ──────────────────────────────────
const CATEGORY_NAMES: Record<string, string> = {
  SMARTPHONE:  'Điện thoại',
  LAPTOP:      'Laptop',
  TABLET:      'Máy tính bảng',
  SMARTWATCH:  'Đồng hồ thông minh',
  EARPHONE:    'Tai nghe',
  SMART_HOME:  'Nhà thông minh',
  ACCESSORIES: 'Phụ kiện',
  MONITOR:     'Màn hình',
  DESKTOP:     'PC / Desktop',
  TV:          'TV',
  STORAGE:     'Lưu trữ',
  CAMERA:      'Camera',
  GAMING:      'Gaming',
  AUDIO:       'Âm thanh',
  APPLIANCE:   'Điện gia dụng',
  PRINTER:     'Máy in',
  PROJECTOR:   'Máy chiếu',
};

/** Danh sách hiển thị cố định — không phụ thuộc API */
const STATIC_SIDEBAR_ITEMS = HOME_PROMO_NAV_ITEMS.map((item) => ({
  code: item.categoryCode,
  name: CATEGORY_NAMES[item.categoryCode] ?? item.categoryCode,
}));

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const HomeCategorySidebar = () => {
  const { navigateWithLoading } = useRouteLoadingNavigation();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch ngầm để lấy DB id + brands — không block hiển thị sidebar
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories', 'roots', 'sidebar'],
    queryFn: () => categoryService.getRootCategories(),
    staleTime: 5 * 60 * 1000,
  });

  // Tra DB id từ code khi cần fetch children
  const hoveredDbId = dbCategories.find((c) => c.code === hoveredCode)?.id ?? null;
  const hoveredDbCat = dbCategories.find((c) => c.code === hoveredCode) ?? null;

  const { data: children = [] } = useQuery<CategoryResponse[]>({
    queryKey: ['categories', 'children', hoveredDbId],
    queryFn: () =>
      hoveredDbId != null ? categoryService.getChildren(hoveredDbId) : Promise.resolve([]),
    enabled: hoveredDbId != null,
    staleTime: 5 * 60 * 1000,
  });

  // Tạo object CategoryResponse tối giản từ static item + dữ liệu DB (nếu có)
  const hoveredCat: CategoryResponse | null = hoveredCode
    ? {
        id: hoveredDbId ?? 0,
        code: hoveredCode,
        name: CATEGORY_NAMES[hoveredCode] ?? hoveredCode,
        status: 1,
        parentId: null,
        parentName: null,
        children: null,
        childrenCount: children.length,
        thumbnailUrl: hoveredDbCat?.thumbnailUrl ?? null,
        brands: hoveredDbCat?.brands ?? null,
      }
    : null;

  const handleRowEnter = (code: string, el: HTMLDivElement) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    const rowRect = el.getBoundingClientRect();
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    setMenuTop(rowRect.top);
    setMenuLeft(sidebarRect?.right ?? rowRect.right);
    setHoveredCode(code);
  };

  const handleLeaveArea = () => {
    leaveTimer.current = setTimeout(() => setHoveredCode(null), 250);
  };

  const handleMenuEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  const showMenu =
    hoveredCode != null &&
    hoveredCat != null &&
    (children.length > 0 ||
      (PRICE_RANGES[hoveredCode]?.length ?? 0) > 0 ||
      (hoveredCat.brands?.length ?? 0) > 0);

  return (
    <aside ref={sidebarRef} className="relative w-[210px] flex-shrink-0 h-full">
      <div className="h-full rounded-md border border-border bg-surface shadow-header overflow-hidden flex flex-col">
        {STATIC_SIDEBAR_ITEMS.map((item) => (
          <div
            key={item.code}
            className="flex-1 flex"
            onMouseEnter={(e) => handleRowEnter(item.code, e.currentTarget)}
            onMouseLeave={handleLeaveArea}
          >
            <button
              type="button"
              onClick={() =>
                navigateWithLoading(`/products?category=${encodeURIComponent(item.code)}`)
              }
              className={`flex w-full items-center gap-2 border-b border-border/50 px-3 text-left text-xs font-medium last:border-b-0 transition-colors ${
                hoveredCode === item.code
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-text-primary hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {ICON_MAP[item.code]
                ? <img src={ICON_MAP[item.code]} alt={item.name} className="h-4 w-4 flex-shrink-0 object-contain" />
                : <span className="text-sm w-4 text-center flex-shrink-0 leading-none">{item.icon}</span>
              }
              <span className="flex-1 line-clamp-1">{item.name}</span>
              {(PRICE_RANGES[item.code] || children.length > 0 || (hoveredDbCat?.brands?.length ?? 0) > 0) && (
                <ChevronRight
                  className={`h-3 w-3 flex-shrink-0 transition-colors ${
                    hoveredCode === item.code ? 'text-blue-500' : 'text-gray-300'
                  }`}
                />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Bridge transparent — lấp vùng trống giữa sidebar border và mega menu */}
      {showMenu && (
        <div
          className="fixed z-[199]"
          style={{ top: menuTop, left: menuLeft - 4, width: 8, height: 200 }}
          onMouseEnter={handleMenuEnter}
        />
      )}

      {/* Mega-menu — rendered fixed, positioned to right of sidebar */}
      {showMenu && hoveredCat && (
        <MegaMenu
          cat={hoveredCat}
          children={children}
          brands={hoveredCat.brands ?? []}
          onNavigate={navigateWithLoading}
          onClose={() => setHoveredCode(null)}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleLeaveArea}
          top={menuTop}
          left={menuLeft}
        />
      )}
    </aside>
  );
};

export default HomeCategorySidebar;
