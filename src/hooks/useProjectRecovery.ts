import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hasWorkingProject } from '@/hooks/useProjectManager';

// Hook to automatically show recovery dialog when navigating
export function useProjectRecovery() {
  const [showRecovery, setShowRecovery] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for working project when navigating away from create page
    if (location.pathname !== '/create' && hasWorkingProject()) {
      setShowRecovery(true);
    }
  }, [location.pathname]);

  return {
    showRecovery,
    setShowRecovery
  };
}