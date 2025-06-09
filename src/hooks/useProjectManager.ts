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
  saveToNostr: (project: ArchitecturalProject) => Promise<ArchitecturalProject>;
  downloadLocal: (project: ArchitecturalProject) => void;
  loadFromFile: () => Promise<ArchitecturalProject>;
  loadFromNostr: (eventId: string) => Promise<ArchitecturalProject>;
  deleteFromNostr: (project: ArchitecturalProject) => Promise<void>;
  clearError: () => void;
}

interface ProjectTransferState {
  project: ArchitecturalProject | null;
}

// In-memory storage for project transfers between pages
const transferState: ProjectTransferState = { project: null };

// Event emitter for project transfers
type ProjectTransferListener = (project: ArchitecturalProject) => void;
const transferListeners: Set<ProjectTransferListener> = new Set();

// Helper functions for project transfer
export function setTransferProject(project: ArchitecturalProject): void {
  transferState.project = project;
  // Notify all listeners
  transferListeners.forEach(listener => listener(project));
}

export function getTransferProject(): ArchitecturalProject | null {
  const project = transferState.project;
  transferState.project = null; // Clear after getting
  return project;
}

export function clearTransferProject(): void {
  transferState.project = null;
}

// Subscribe to transfer events
export function onProjectTransfer(listener: ProjectTransferListener): () => void {
  transferListeners.add(listener);
  return () => {
    transferListeners.delete(listener);
  };
}

// Working project functions for recovery/autosave features
let workingProject: ArchitecturalProject | null = null;
let workingProjectLastModified: number | null = null;
let lastSavedState: string | null = null; // JSON string of last saved project state

export function hasWorkingProject(): boolean {
  return workingProject !== null;
}

export function getWorkingProject(): ArchitecturalProject | null {
  return workingProject;
}

export function getWorkingProjectLastModified(): number | null {
  return workingProjectLastModified;
}

export function setWorkingProject(project: ArchitecturalProject): void {
  workingProject = project;
  workingProjectLastModified = Date.now();
}

export function clearWorkingProject(): void {
  workingProject = null;
  workingProjectLastModified = null;
  lastSavedState = null;
}

export function markProjectAsSaved(project: ArchitecturalProject): void {
  lastSavedState = JSON.stringify({
    elements: project.elements,
    metadata: project.metadata,
    name: project.name,
    description: project.description
  });
}

export function hasUnsavedChanges(currentProject: ArchitecturalProject): boolean {
  if (!lastSavedState) {
    // If there's no saved state, consider it unsaved if there are elements or the project has been modified
    return currentProject.elements.length > 0 || currentProject.name !== 'New Architecture Project';
  }
  
  const currentState = JSON.stringify({
    elements: currentProject.elements,
    metadata: currentProject.metadata,
    name: currentProject.name,
    description: currentProject.description
  });
  
  return currentState !== lastSavedState;
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

      // Use existing nostrAddress if available (for updates), otherwise use project.id
      // This ensures we update the same addressable event rather than creating a new one
      const vitruviusId = project.nostrAddress || project.id;

      // Create the updated project with current timestamp
      const updatedProject = {
        ...project,
        author: user.pubkey, // Ensure author matches current user
        updated_at: Date.now()
      };

      // Create event content
      const eventContent = JSON.stringify(updatedProject);

      // Create and publish the event using the standard hook
      const event = await publishEvent({
        kind: VITRUVIUS_KIND,
        content: eventContent,
        tags: createProjectTags(project, vitruviusId),
      });

      return { event, project: updatedProject };
    },
    onSuccess: ({ project: savedProject }) => {
      // Mark project as saved using the updated project state
      markProjectAsSaved(savedProject);
      
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
      markProjectAsSaved(project); // Mark as saved after download
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
      markProjectAsSaved(project); // Mark newly loaded project as saved
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

      // Extract the 'd' tag value
      const dTag = event.tags.find(([tagName]) => tagName === 'd')?.[1];

      // Add the event ID and d-tag to the project for future reference
      project.eventId = event.id;
      project.nostrAddress = dTag;

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
    const result = await saveToNostrMutation.mutateAsync(project);
    return result.project; // Return the updated project
  }, [saveToNostrMutation]);

  /**
   * Deletes project from Nostr using kind 5 deletion request
   */
  const deleteFromNostrMutation = useMutation({
    mutationFn: async (project: ArchitecturalProject) => {
      if (!user?.signer) {
        throw new ProjectStorageError('User must be logged in to delete projects', 'nostr');
      }

      // If the project has an eventId, use it directly
      if (project.eventId) {
        // Create deletion request event (kind 5) using the known event ID
        const deletionEvent = await publishEvent({
          kind: 5, // Deletion request kind
          content: 'Project deleted by author',
          tags: [
            ['e', project.eventId], // Reference the event to delete
            ['k', String(VITRUVIUS_KIND)], // Kind of the referenced event
          ],
        });
        return deletionEvent;
      }

      // Otherwise, try to find the project on Nostr
      // We need the project's Nostr event ID to delete it
      // Query for the project's event first
      const vitruviusId = project.id; // Using project ID as the d-tag identifier
      
      const events = await nostr.query(
        [{
          kinds: [VITRUVIUS_KIND],
          authors: [user.pubkey],
          '#d': [vitruviusId],
          limit: 1
        }],
        { signal: AbortSignal.timeout(5000) }
      );

      if (events.length === 0) {
        // Try to find by content matching (fallback)
        const allUserEvents = await nostr.query(
          [{
            kinds: [VITRUVIUS_KIND],
            authors: [user.pubkey],
            limit: 100
          }],
          { signal: AbortSignal.timeout(5000) }
        );

        const matchingEvent = allUserEvents.find(event => {
          try {
            const eventProject = JSON.parse(event.content) as ArchitecturalProject;
            return eventProject.id === project.id;
          } catch {
            return false;
          }
        });

        if (!matchingEvent) {
          throw new ProjectStorageError('Project not found on Nostr. It may not have been saved yet.', 'nostr');
        }

        const projectEvent = matchingEvent;
        
        // Create deletion request event (kind 5)
        const deletionEvent = await publishEvent({
          kind: 5, // Deletion request kind
          content: 'Project deleted by author',
          tags: [
            ['e', projectEvent.id], // Reference the event to delete
            ['k', String(VITRUVIUS_KIND)], // Kind of the referenced event
            ['a', `${VITRUVIUS_KIND}:${user.pubkey}:${vitruviusId}`] // Reference the replaceable event
          ],
        });

        return deletionEvent;
      }

      const projectEvent = events[0];

      // Create deletion request event (kind 5)
      const deletionEvent = await publishEvent({
        kind: 5, // Deletion request kind
        content: 'Project deleted by author',
        tags: [
          ['e', projectEvent.id], // Reference the event to delete
          ['k', String(VITRUVIUS_KIND)], // Kind of the referenced event
          ['a', `${VITRUVIUS_KIND}:${user.pubkey}:${vitruviusId}`] // Reference the replaceable event
        ],
      });

      return deletionEvent;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh gallery
      queryClient.invalidateQueries({ queryKey: ['vitruvius-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (err) => {
      console.error('Failed to delete project from Nostr:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete project from Nostr';
      setError(message);
    },
  });

  const deleteFromNostr = useCallback(async (project: ArchitecturalProject) => {
    setError(null);
    await deleteFromNostrMutation.mutateAsync(project);
  }, [deleteFromNostrMutation]);

  return {
    // State
    isLoading: isLoading || saveToNostrMutation.isPending || deleteFromNostrMutation.isPending,
    error,

    // Actions
    saveToNostr,
    downloadLocal,
    loadFromFile,
    loadFromNostr,
    deleteFromNostr,
    clearError,
  };
}