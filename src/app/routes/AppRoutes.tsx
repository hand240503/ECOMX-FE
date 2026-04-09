import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthGuard from '../guards/AuthGuard';
import HomePage from '../../pages/HomePage';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import ProfilePage from '../../pages/profile/ProfilePage';
import ProtectedRoute from '../guards/ProtectedRoute';
import AccountInfoTab from '../../pages/profile/components/AccountInfoTab';
import EditPasswordTab from '../../pages/profile/components/EditPasswordTab';
import EditPhoneTab from '../../pages/profile/components/EditPhoneTab';
import EditEmailTab from '../../pages/profile/components/EditEmailTab';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import VerifyForgotOtpPage from '../../pages/auth/VerifyForgotOtpPage';
import ResetPasswordPage from '../../pages/auth/ResetPasswordPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

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
          <Route path="notifications" element={<p className="text-gray-600">Danh sách thông báo của bạn.</p>} />
          <Route path="orders" element={<p className="text-gray-600">Lịch sử và quản lý đơn hàng của bạn.</p>} />
          <Route path="returns" element={<p className="text-gray-600">Yêu cầu đổi trả hàng hóa.</p>} />
          <Route path="address" element={<p className="text-gray-600">Danh sách các địa chỉ nhận hàng.</p>} />
          <Route path="payment" element={<p className="text-gray-600">Các phương thức thanh toán đã lưu.</p>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
