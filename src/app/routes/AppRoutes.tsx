import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useParams,
} from 'react-router-dom';
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
import CheckoutPage from '../../pages/CheckoutPage';
import VnpayCallbackPage from '../../pages/payment/VnpayCallbackPage';
import NotFoundPage from '../../pages/NotFoundPage';
import OrderDetailTab from '../../pages/orders/OrderDetailTab';
import OrdersTab from '../../pages/orders/OrdersTab';
import OrdersPage from '../../pages/orders/OrdersPage';
import { useI18n } from '../../i18n/I18nProvider';
import MapDevPage from '../../pages/dev/MapDevPage';

/** Đường dẫn cũ /account/orders/:id → /orders/:id */
function LegacyAccountOrderRedirect() {
  const { orderId } = useParams<{ orderId: string }>();
  if (orderId == null || orderId === '') return <Navigate to="/orders" replace />;
  return <Navigate to={`/orders/${orderId}`} replace />;
}

function ProfileTabPlaceholder({ messageKey }: { messageKey: string }) {
  const { t } = useI18n();
  return <p className="text-gray-600">{t(messageKey)}</p>;
}

function AppRootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppRootLayout />}>
      <Route index element={<HomePage />} />

      <Route path="search" element={<SearchPage />} />

      <Route path="products/category/:categoryId" element={<CategoryProductsPage />} />
      <Route path="products/:productId" element={<ProductDetailPage />} />
      <Route path="products" element={<CategoryProductsPage />} />

      <Route path="cart" element={<CartPage />} />

      <Route
        path="checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="payment/vnpay-callback"
        element={
          <ProtectedRoute>
            <VnpayCallbackPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrdersTab />} />
        <Route path=":orderId" element={<OrderDetailTab />} />
      </Route>

      <Route path="404" element={<NotFoundPage />} />

      <Route path="map-dev" element={<MapDevPage />} />

      <Route
        path="login"
        element={
          <AuthGuard>
            <LoginPage />
          </AuthGuard>
        }
      />

      <Route
        path="register"
        element={
          <AuthGuard>
            <RegisterPage />
          </AuthGuard>
        }
      />

      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="forgot-password/verify" element={<VerifyForgotOtpPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />

      <Route
        path="account"
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
        <Route path="orders" element={<Navigate to="/orders" replace />} />
        <Route path="orders/:orderId" element={<LegacyAccountOrderRedirect />} />
        <Route path="returns" element={<ProfileTabPlaceholder messageKey="profile_placeholder_returns" />} />
        <Route path="address" element={<AddressBookTab />} />
        <Route path="address/new" element={<AddUserAddressTab />} />
        <Route path="address/:addressId/edit" element={<EditUserAddressTab />} />
        <Route path="payment" element={<ProfileTabPlaceholder messageKey="profile_placeholder_payment" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
