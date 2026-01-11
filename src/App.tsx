import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AppRoutes />
    </>
  );
}

export default App;