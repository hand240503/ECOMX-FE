import type { MouseEvent } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import MainHeader from '../../layout/header/MainHeader';
import MainFooter from '../../layout/footer/MainFooter';
import { useAuth } from '../../app/auth/AuthProvider';
import { buildUserBadge } from '../../domain/user/buildUserBadge';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';
import LoadingLink from '../../components/LoadingLink';

const navItems = [
  { id: 'account', path: '/account', label: 'Thông tin tài khoản', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { id: 'notifications', path: '/account/notifications', label: 'Thông báo của tôi', icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
  { id: 'orders', path: '/account/orders', label: 'Quản lý đơn hàng', icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' },
  { id: 'returns', path: '/account/returns', label: 'Quản lý đổi trả', icon: 'M19 7h-8v6h8V7zm-2 4h-4V9h4v2zm4-8H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H3V5h14v2h2V5c0-1.1-.9-2-2-2zm0 14h-4v2h4c1.1 0 2-.9 2-2v-2h-2v2z' },
  { id: 'address', path: '/account/address', label: 'Sổ địa chỉ', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { id: 'payment', path: '/account/payment', label: 'Thông tin thanh toán', icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
];

const routeTitleOverrides: Record<string, string> = {
  '/account/edit/pass': 'Thiết lập mật khẩu',
  '/account/edit/phone': 'Số điện thoại',
  '/account/edit/email': 'Địa chỉ email'
};

const ProfilePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isRouteLoading, navigateWithLoading } = useRouteLoadingNavigation();

  const badge = buildUserBadge(
    {
      fullName: user?.userInfo?.fullName,
      email: user?.email,
      avatar: user?.userInfo?.avatar
    },
    'Tài khoản'
  );

  const nickname = user?.username?.trim() ?? '';
  const sidebarTitle = [badge.label, nickname].filter(Boolean).join(' · ');

  const activeLabel =
    routeTitleOverrides[location.pathname] ??
    navItems.find((item) => item.path === location.pathname)?.label ??
    navItems[0].label;

  const handleTabNavigation = (event: MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    // Let browser handle new-tab/window interactions.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    if (targetPath === location.pathname || isRouteLoading) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    navigateWithLoading(targetPath, { delayMs: 500 });
  };

  return (
    <>
      <MainHeader />

      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f4f5fb' }}>
        <nav className="profile-breadcrumb">
          <LoadingLink to="/" className="profile-breadcrumb__link">
            Trang chủ
          </LoadingLink>
          <span className="profile-breadcrumb__separator">&gt;</span>
          <span className="profile-breadcrumb__current">{activeLabel}</span>
        </nav>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar__header">
              {badge.avatarUrl ? (
                <img src={badge.avatarUrl} alt={sidebarTitle} className="profile-sidebar__avatar" />
              ) : (
                <div className="profile-sidebar__avatar-placeholder">{badge.initial}</div>
              )}
              <div className="profile-sidebar__user-line" title={sidebarTitle}>
                <span className="profile-sidebar__user-name">{badge.label}</span>
                {nickname ? (
                  <>
                    <span className="profile-sidebar__user-line-sep" aria-hidden="true" />
                    <span className="profile-sidebar__user-nickname">@{nickname}</span>
                  </>
                ) : null}
              </div>
            </div>

            <nav className="profile-sidebar__nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.id === 'account'}
                  onClick={(event) => handleTabNavigation(event, item.path)}
                  className={({ isActive }) =>
                    `profile-sidebar__nav-item ${isActive ? 'profile-sidebar__nav-item--active' : ''} ${isRouteLoading ? 'profile-sidebar__nav-item--disabled' : ''}`
                  }
                >
                  <svg className="profile-sidebar__nav-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className='flex-1'>
            <h1 className="profile-content-title">{activeLabel}</h1>
            <div className='profile-content'>
              {isRouteLoading ? (
                <div className="profile-tab-loading-dots" aria-busy="true" aria-live="polite">
                  <span className="profile-tab-loading-dots__dot" />
                  <span className="profile-tab-loading-dots__dot" />
                  <span className="profile-tab-loading-dots__dot" />
                </div>
              ) : (
                <Outlet />
              )}
            </div>
          </main>
        </div>
      </div>

      <MainFooter />
    </>
  );
};

export default ProfilePage;
