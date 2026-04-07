import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './auth/AuthProvider';
import { RouteLoadingProvider } from './loading/RouteLoadingProvider';
import '../App.css';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <RouteLoadingProvider>
          <AppRoutes />
        </RouteLoadingProvider>
      </AuthProvider>
    </>
  );
};

export default App;
