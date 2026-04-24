/** Sidebar khu vực tài khoản (profile + đơn hàng + …) — dùng chung ProfilePage & OrdersPage. */
export const ACCOUNT_NAV_DEFS = [
  {
    id: 'account',
    path: '/account',
    labelKey: 'profile_nav_account',
    icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  },
  {
    id: 'notifications',
    path: '/account/notifications',
    labelKey: 'profile_nav_notifications',
    icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  },
  {
    id: 'orders',
    path: '/orders',
    labelKey: 'profile_nav_orders',
    icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  },
  {
    id: 'returns',
    path: '/account/returns',
    labelKey: 'profile_nav_returns',
    icon: 'M19 7h-8v6h8V7zm-2 4h-4V9h4v2zm4-8H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H3V5h14v2h2V5c0-1.1-.9-2-2-2zm0 14h-4v2h4c1.1 0 2-.9 2-2v-2h-2v2z',
  },
  {
    id: 'address',
    path: '/account/address',
    labelKey: 'profile_nav_address',
    icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  },
  {
    id: 'payment',
    path: '/account/payment',
    labelKey: 'profile_nav_payment',
    icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
  },
] as const;
