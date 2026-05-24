import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';
import { HOME_PROMO_NAV_ITEMS } from './homePromoNavItems';
import { ChevronRight } from 'lucide-react';

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

const CATEGORY_NAMES: Record<string, string> = {
  SMARTPHONE:  'Điện thoại',
  LAPTOP:      'Laptop',
  TABLET:      'Máy tính bảng',
  SMARTWATCH:  'Đồng hồ TM',
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

/** Hiển thị 8 danh mục đầu dạng icon card ngang */
const VISIBLE_ITEMS = HOME_PROMO_NAV_ITEMS.slice(0, 8);

export default function HomeCategoryRow() {
  const { navigateWithLoading } = useRouteLoadingNavigation();

  return (
    <section className="mt-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-text-primary">Danh mục nổi bật</h2>
        <button
          type="button"
          onClick={() => navigateWithLoading('/products')}
          className="flex items-center gap-0.5 text-xs font-medium text-danger hover:underline"
        >
          Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Grid 8 cột */}
      <div className="grid grid-cols-4 gap-2 tablet:grid-cols-8">
        {VISIBLE_ITEMS.map((item) => {
          const name = CATEGORY_NAMES[item.categoryCode] ?? item.categoryCode;
          const icon = ICON_MAP[item.categoryCode];
          return (
            <button
              key={item.categoryCode}
              type="button"
              onClick={() =>
                navigateWithLoading(
                  `/products?category=${encodeURIComponent(item.categoryCode)}`
                )
              }
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-2 py-3 text-center shadow-sm transition-all hover:border-danger/40 hover:shadow-md"
            >
              {/* Icon container */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/5 transition-colors group-hover:bg-danger/10">
                {icon ? (
                  <img
                    src={icon}
                    alt={name}
                    className="h-6 w-6 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-lg">{item.icon}</span>
                )}
              </div>

              {/* Name */}
              <span className="line-clamp-2 text-[11px] font-medium leading-tight text-text-primary group-hover:text-danger">
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
