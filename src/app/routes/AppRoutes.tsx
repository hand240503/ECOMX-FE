import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './ScrollToTop';
import AuthGuard from '../guards/AuthGuard';
import HomePage from '../../pages/HomePage';
import SearchPage from '../../pages/search/SearchPage';
import CategoryProductsPage from '../../pages/category/CategoryProductsPage';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import ProfilePage from '../../pages/profile/ProfilePage';
import ProtectedRoute from '../guards/ProtectedRoute';
import AccountInfoTab from '../../pages/profile/components/AccountInfoTab';
import EditPasswordTab from '../../pages/profile/components/EditPasswordTab';
import EditPhoneTab from '../../pages/profile/components/EditPhoneTab';
import EditEmailTab from '../../pages/profile/components/EditEmailTab';
import AddressBookTab from '../../pages/profile/components/AddressBookTab';
import AddUserAddressTab from '../../pages/profile/components/AddUserAddressTab';
import EditUserAddressTab from '../../pages/profile/components/EditUserAddressTab';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import VerifyForgotOtpPage from '../../pages/auth/VerifyForgotOtpPage';
import ResetPasswordPage from '../../pages/auth/ResetPasswordPage';
import ProductDetailPage from '../../pages/product/ProductDetailPage';
import CartPage from '../../pages/CartPage';
import NotFoundPage from '../../pages/NotFoundPage';
import { useI18n } from '../../i18n/I18nProvider';

function ProfileTabPlaceholder({ messageKey }: { messageKey: string }) {
  const { t } = useI18n();
  return <p className="text-gray-600">{t(messageKey)}</p>;
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/search" element={<SearchPage />} />

        <Route path="/products/category/:categoryId" element={<CategoryProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/products" element={<CategoryProductsPage />} />

        <Route path="/cart" element={<CartPage />} />

        <Route path="/404" element={<NotFoundPage />} />

        <Route
          path="/login"
          element={
            <AuthGuard>
              <LoginPage />
            </AuthGuard>
          }
        />

        <Route
          path="/register"
          element={
            <AuthGuard>
              <RegisterPage />
            </AuthGuard>
          }
        />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/verify" element={<VerifyForgotOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountInfoTab />} />
          <Route path="edit/pass" element={<EditPasswordTab />} />
          <Route path="edit/phone" element={<EditPhoneTab />} />
          <Route path="edit/email" element={<EditEmailTab />} />
          <Route
            path="notifications"
            element={<ProfileTabPlaceholder messageKey="profile_placeholder_notifications" />}
          />
          <Route path="orders" element={<ProfileTabPlaceholder messageKey="profile_placeholder_orders" />} />
          <Route path="returns" element={<ProfileTabPlaceholder messageKey="profile_placeholder_returns" />} />
          <Route path="address" element={<AddressBookTab />} />
          <Route path="address/new" element={<AddUserAddressTab />} />
          <Route path="address/:addressId/edit" element={<EditUserAddressTab />} />
          <Route path="payment" element={<ProfileTabPlaceholder messageKey="profile_placeholder_payment" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
