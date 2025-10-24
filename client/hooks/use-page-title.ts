import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/': 'Manager Ask - Task Management Dashboard',
  '/login': 'Login - Manager Ask',
  '/signup': 'Sign Up - Manager Ask',
  '/auth/success': 'Success - Manager Ask',
  '/dashboard': 'Dashboard - Manager Ask',
  '/dashboard/tasks': 'Tasks - Manager Ask',
  '/dashboard/chat': 'Chat - Manager Ask',
  '/dashboard/leaves': 'Leaves - Manager Ask',
  '/dashboard/analytics': 'Analytics - Manager Ask',
  '/dashboard/settings': 'Settings - Manager Ask',
  '/dashboard/roles': 'Roles - Manager Ask',
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const title = routeTitles[location.pathname] || 'Manager Ask - Task Management Dashboard';
    document.title = title;
  }, [location]);
};
