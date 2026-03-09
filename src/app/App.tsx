import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import '../App.css';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <AppRoutes />
    </>
  );
};

export default App;
