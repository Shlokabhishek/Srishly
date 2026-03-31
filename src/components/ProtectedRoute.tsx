import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import PageLoader from '@/components/ui/PageLoader';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader fullScreen label="Checking authentication" />;
  }

  if (!session) {
    return <Navigate replace to={ROUTES.auth} state={{ from: location.pathname }} />;
  }

  return children;
}

export function AdminRoute({ children }: { children: ReactElement }) {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader fullScreen label="Checking admin access" />;
  }

  if (!session) {
    return <Navigate replace to={ROUTES.auth} state={{ from: location.pathname }} />;
  }

  if (!session.user.isAdmin) {
    return <Navigate replace to={ROUTES.dashboard} />;
  }

  return children;
}
