import { useEffect } from 'react';
import { getTransferProject, onProjectTransfer } from '@/hooks/useProjectManager';
import { ArchitecturalProject } from '@/types/architecture';

/**
 * Hook to handle project transfers between pages/components
 * 
 * @param onProjectReceived - Callback when a project is transferred
 * @returns void
 * 
 * @example
 * ```tsx
 * useProjectTransfer((project) => {
 *   setProject(project);
 * });
 * ```
 */
export function useProjectTransfer(
  onProjectReceived: (project: ArchitecturalProject) => void
): void {
  // Check for any project that was transferred before component mounted
  useEffect(() => {
    const transferredProject = getTransferProject();
    if (transferredProject) {
      onProjectReceived(transferredProject);
    }
  }, [onProjectReceived]);

  // Subscribe to future project transfers
  useEffect(() => {
    const unsubscribe = onProjectTransfer(onProjectReceived);
    return unsubscribe;
  }, [onProjectReceived]);
}