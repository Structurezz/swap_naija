import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

function ProtectedRoute() {
  const { accessToken, user, initialized } = useAuthStore();

  if (!initialized) return null;

  if (!accessToken || !user) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
