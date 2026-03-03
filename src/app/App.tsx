import { RouterProvider } from 'react-router';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { router } from './routes';
import LoadingScreen from './components/LoadingScreen';

function AppInner() {
  const { isLoading, dbError } = useApp();
  if (isLoading || dbError) return <LoadingScreen error={dbError} />;
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
