import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthSuccess() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      await refreshUser();
      navigate('/dashboard', { replace: true });
    };
    run();
  }, [refreshUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Finalizing sign in...</p>
      </div>
    </div>
  );
}
