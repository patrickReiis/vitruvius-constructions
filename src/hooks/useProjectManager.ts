/**
 * Project Management Hook
 * Provides save, download, and load functionality for architectural projects
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useNostr } from '@nostrify/react';
import { ArchitecturalProject } from '@/types/architecture';
import {
  VITRUVIUS_KIND,
  generateVitruviusId,
  downloadProjectAsJson,
  loadProjectFromFile,
  createProjectTags,
  ProjectStorageError,
} from '@/lib/projectStorage';

interface UseProjectManagerReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveToNostr: (project: ArchitecturalProject) => Promise<void>;
  downloadLocal: (project: ArchitecturalProject) => void;
  loadFromFile: () => Promise<ArchitecturalProject>;
  loadFromNostr: (eventId: string) => Promise<ArchitecturalProject>;
  clearError: () => void;
}

interface ProjectTransferState {
  project: ArchitecturalProject | null;
}

// In-memory storage for project transfers between pages
const transferState: ProjectTransferState = { project: null };

// Helper functions for project transfer
export function setTransferProject(project: ArchitecturalProject): void {
  transferState.project = project;
}

export function getTransferProject(): ArchitecturalProject | null {
  const project = transferState.project;
  transferState.project = null; // Clear after getting
  return project;
}

export function clearTransferProject(): void {
  transferState.project = null;
}

export function useProjectManager(): UseProjectManagerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { nostr } = useNostr();
  const queryClient = useQueryClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Saves project to Nostr as addressable event
   */
  const saveToNostrMutation = useMutation({
    mutationFn: async (project: ArchitecturalProject) => {
      if (!user?.signer) {
        throw new ProjectStorageError('User must be logged in to save projects', 'nostr');
      }

      // Generate unique vitruvius ID for this save operation
      const vitruviusId = generateVitruviusId();

      // Create event content
      const eventContent = JSON.stringify({
        ...project,
        author: user.pubkey, // Ensure author matches current user
        updated_at: Date.now()
      });

      // Create and publish the event using the standard hook
      const event = await publishEvent({
        kind: VITRUVIUS_KIND,
        content: eventContent,
        tags: createProjectTags(project, vitruviusId),
      });

      return event;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh gallery
      queryClient.invalidateQueries({ queryKey: ['vitruvius-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (err) => {
      console.error('Failed to save project to Nostr:', err);
      const message = err instanceof Error ? err.message : 'Failed to save project to Nostr';
      setError(message);
    },
  });

  /**
   * Downloads project as local JSON file
   */
  const downloadLocal = useCallback((project: ArchitecturalProject) => {
    try {
      setError(null);
      downloadProjectAsJson(project);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download project';
      setError(message);
    }
  }, []);

  /**
   * Loads project from local JSON file
   */
  const loadFromFile = useCallback(async (): Promise<ArchitecturalProject> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const project = await loadProjectFromFile();
      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load project from file';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Loads project from Nostr event by ID
   */
  const loadFromNostr = useCallback(async (eventId: string): Promise<ArchitecturalProject> => {
    try {
      setIsLoading(true);
      setError(null);

      // Query for the specific event
      const events = await nostr.query(
        [{ ids: [eventId], kinds: [VITRUVIUS_KIND] }],
        { signal: AbortSignal.timeout(5000) }
      );

      if (events.length === 0) {
        throw new ProjectStorageError('Project not found', 'nostr');
      }

      const event = events[0];
      const project = JSON.parse(event.content) as ArchitecturalProject;

      // Validate the project data
      if (!project.id || !project.name || !Array.isArray(project.elements)) {
        throw new ProjectStorageError('Invalid project data', 'validation');
      }

      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load project from Nostr';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [nostr]);

  // Main save function that wraps the mutation
  const saveToNostr = useCallback(async (project: ArchitecturalProject) => {
    setError(null);
    await saveToNostrMutation.mutateAsync(project);
  }, [saveToNostrMutation]);

  return {
    // State
    isLoading: isLoading || saveToNostrMutation.isPending,
    error,

    // Actions
    saveToNostr,
    downloadLocal,
    loadFromFile,
    loadFromNostr,
    clearError,
  };
}