import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArchitecturalProject } from '@/types/architecture';
import { hasUnsavedChanges } from './useProjectManager';

interface UseUnsavedChangesWarningOptions {
  project: ArchitecturalProject;
  enabled?: boolean;
}

export function useUnsavedChangesWarning({
  project,
  enabled = true
}: UseUnsavedChangesWarningOptions) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there are unsaved changes
  const hasChanges = hasUnsavedChanges(project);

  // Handle browser navigation (back/forward buttons, closing tab, etc.)
  useEffect(() => {
    if (!enabled || !hasChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Standard browser warning message (can't use custom React dialogs here)
      const message = "You have unsaved changes that will be lost. Are you sure you want to leave?";
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasChanges]);

  // Return utility functions for components to use
  const checkUnsavedChangesBeforeAction = useCallback(
    (action: () => void, showDialog?: (action: () => void) => void) => {
      if (!enabled || !hasChanges) {
        action();
        return;
      }

      if (showDialog) {
        showDialog(action);
        return;
      }

      // Fallback to browser confirm
      const confirmed = window.confirm(
        "You have unsaved changes that will be lost. Are you sure you want to continue?"
      );

      if (confirmed) {
        action();
      }
    },
    [enabled, hasChanges]
  );

  const safeNavigate = useCallback(
    (to: string | number, options?: object, showDialog?: (action: () => void) => void) => {
      checkUnsavedChangesBeforeAction(() => {
        if (typeof to === 'string') {
          navigate(to, options);
        } else {
          navigate(to);
        }
      }, showDialog);
    },
    [navigate, checkUnsavedChangesBeforeAction]
  );

  return {
    hasUnsavedChanges: hasChanges,
    checkUnsavedChangesBeforeAction,
    safeNavigate
  };
}