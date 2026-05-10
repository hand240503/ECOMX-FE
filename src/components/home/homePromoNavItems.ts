/**
 * 17 danh mục chính trên trang chủ (QuickLinks) — link `/products?category=<code>`.
 * `categoryCode` phải khớp `code` danh mục từ API / catalog.
 */
export const HOME_PROMO_NAV_ITEMS = [
  { id: 1, icon: '📱', titleKey: 'quick_link_smartphone', categoryCode: 'SMARTPHONE' },
  { id: 2, icon: '💻', titleKey: 'quick_link_laptop', categoryCode: 'LAPTOP' },
  { id: 3, icon: '📲', titleKey: 'quick_link_tablet', categoryCode: 'TABLET' },
  { id: 4, icon: '⌚', titleKey: 'quick_link_smartwatch', categoryCode: 'SMARTWATCH' },
  { id: 5, icon: '🎧', titleKey: 'quick_link_earphone', categoryCode: 'EARPHONE' },
  { id: 6, icon: '🏠', titleKey: 'quick_link_smart_home', categoryCode: 'SMART_HOME' },
  { id: 7, icon: '🔌', titleKey: 'quick_link_accessories', categoryCode: 'ACCESSORIES' },
  { id: 8, icon: '🖥️', titleKey: 'quick_link_monitor', categoryCode: 'MONITOR' },
  { id: 9, icon: '⌨️', titleKey: 'quick_link_desktop', categoryCode: 'DESKTOP' },
  { id: 10, icon: '📺', titleKey: 'quick_link_tv', categoryCode: 'TV' },
  { id: 11, icon: '💾', titleKey: 'quick_link_storage', categoryCode: 'STORAGE' },
  { id: 12, icon: '📷', titleKey: 'quick_link_camera', categoryCode: 'CAMERA' },
  { id: 13, icon: '🎮', titleKey: 'quick_link_gaming', categoryCode: 'GAMING' },
  { id: 14, icon: '🔊', titleKey: 'quick_link_audio', categoryCode: 'AUDIO' },
  { id: 15, icon: '🧰', titleKey: 'quick_link_appliance', categoryCode: 'APPLIANCE' },
  { id: 16, icon: '🖨️', titleKey: 'quick_link_printer', categoryCode: 'PRINTER' },
  { id: 17, icon: '📽️', titleKey: 'quick_link_projector', categoryCode: 'PROJECTOR' },
] as const;

export type HomePromoNavItem = (typeof HOME_PROMO_NAV_ITEMS)[number];

export function homePromoCategoryPath(categoryCode: string): string {
  const code = categoryCode.trim();
  if (!code) return '/products';
  return `/products?category=${encodeURIComponent(code)}`;
}
