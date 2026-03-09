import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthGuard from '../guards/AuthGuard';
import HomePage from '../../features/home/pages/HomePage';
import LoginPage from '../../features/auth/pages/LoginPage';
import RegisterPage from '../../features/auth/pages/RegisterPage';

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
