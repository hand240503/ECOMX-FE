import { Link } from 'react-router-dom';
import MainHeader from '../layout/header/MainHeader';
import MainFooter from '../layout/footer/MainFooter';
import { useAuth } from '../app/auth/AuthProvider';
import { buildUserBadge } from '../domain/user/buildUserBadge';

const navItems = [
  { id: 'account', label: 'Thông tin tài khoản', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', active: true },
  { id: 'notifications', label: 'Thông báo của tôi', icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
  { id: 'orders', label: 'Quản lý đơn hàng', icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' },
  { id: 'returns', label: 'Quản lý đổi trả', icon: 'M19 7h-8v6h8V7zm-2 4h-4V9h4v2zm4-8H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H3V5h14v2h2V5c0-1.1-.9-2-2-2zm0 14h-4v2h4c1.1 0 2-.9 2-2v-2h-2v2z' },
  { id: 'address', label: 'Sổ địa chỉ', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { id: 'payment', label: 'Thông tin thanh toán', icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
];

const ProfilePage = () => {
  const { user } = useAuth();

  const badge = buildUserBadge(
    {
      fullName: user?.userInfo?.fullName,
      firstName: user?.userInfo?.firstName,
      lastName: user?.userInfo?.lastName,
      email: user?.email,
      avatar: user?.userInfo?.avatar
    },
    'Tài khoản'
  );

  return (
    <>
      <MainHeader />

      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f4f5fb' }}>
        <nav className="profile-breadcrumb">
          <Link to="/" className="profile-breadcrumb__link">
            Trang chủ
          </Link>
          <span className="profile-breadcrumb__separator">&gt;</span>
          <span className="profile-breadcrumb__current">Thông tin tài khoản</span>
        </nav>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar__header">
              {badge.avatarUrl ? (
                <img src={badge.avatarUrl} alt={badge.label} className="profile-sidebar__avatar" />
              ) : (
                <div className="profile-sidebar__avatar-placeholder">{badge.initial}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="profile-sidebar__user-label">Tài khoản của</p>
                <p className="profile-sidebar__user-name" title={badge.label}>
                  {badge.label}
                </p>
              </div>
            </div>

            <nav className="profile-sidebar__nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`profile-sidebar__nav-item ${item.active ? 'profile-sidebar__nav-item--active' : ''}`}
                >
                  <svg className="profile-sidebar__nav-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className='flex-1'>
            <h1 className="profile-content-title">Thông tin tài khoản</h1>
            <div className='profile-content'>
              <p className="text-gray-600">Nội dung thông tin tài khoản sẽ hiển thị ở đây.</p>
            </div>
          </main>
        </div>
      </div>

      <MainFooter />
    </>
  );
};

export default ProfilePage;
