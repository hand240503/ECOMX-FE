import { useMemo, type MouseEvent } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import MainHeader from '../../layout/header/MainHeader';
import MainFooter from '../../layout/footer/MainFooter';
import { useAuth } from '../../app/auth/AuthProvider';
import { buildUserBadge } from '../../domain/user/buildUserBadge';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';
import CategoryBreadcrumb, { type BreadcrumbItem } from '../category/CategoryBreadcrumb';
import { useI18n } from '../../i18n/I18nProvider';
import { ACCOUNT_NAV_DEFS } from '../accountAreaNav';

const orderDetailPathPattern = /^\/orders\/\d+$/;

/** Layout đơn hàng: shell giống ProfilePage; route con là OrdersTab / OrderDetailTab. */
export default function OrdersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const { isRouteLoading, navigateWithLoading } = useRouteLoadingNavigation();

  const navItems = useMemo(
    () => ACCOUNT_NAV_DEFS.map((item) => ({ ...item, label: t(item.labelKey) })),
    [t]
  );

  const badge = buildUserBadge(
    {
      fullName: user?.userInfo?.fullName,
      email: user?.email,
      avatar: user?.userInfo?.avatar,
    },
    t('profile_account_fallback_label')
  );

  const nickname = user?.username?.trim() ?? '';
  const sidebarTitle = [badge.label, nickname].filter(Boolean).join(' · ');

  const activeLabel = useMemo(() => {
    if (orderDetailPathPattern.test(location.pathname)) return t('profile_title_order_detail');
    return t('profile_nav_orders');
  }, [location.pathname, t]);

  const profileBreadcrumbItems = useMemo<BreadcrumbItem[]>(
    () => [{ label: activeLabel, current: true }],
    [activeLabel]
  );

  const handleTabNavigation = (event: MouseEvent<HTMLAnchorElement>, targetPath: string) => {
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
        <div className="mx-auto flex min-h-10 w-full max-w-[1240px] items-center px-[15px] py-2">
          <CategoryBreadcrumb items={profileBreadcrumbItems} />
        </div>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar__header">
              {badge.avatarUrl ? (
                <img src={badge.avatarUrl} alt={sidebarTitle} className="profile-sidebar__avatar" />
              ) : (
                <div className="profile-sidebar__avatar-placeholder">{badge.initial}</div>
              )}
              <div className="profile-sidebar__user-line profile-sidebar__user-line--stack" title={sidebarTitle}>
                <div className="profile-sidebar__user-heading">
                  <span className="profile-sidebar__user-prefix">{t('profile_sidebar_account_of')}</span>
                  <span className="profile-sidebar__user-name">{badge.label}</span>
                </div>
                {nickname ? (
                  <span className="profile-sidebar__user-nickname profile-sidebar__user-nickname--block">
                    @{nickname}
                  </span>
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

          <main className="flex-1">
            <h1 className="profile-content-title">{activeLabel}</h1>
            <div className="flex min-h-[400px] w-full items-center justify-center bg-[#f4f5fb]">
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
}
