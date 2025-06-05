import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { ArchitecturalProject } from '@/types/architecture';
import { VITRUVIUS_KIND, parseProjectFromNostrEvent } from '@/lib/projectStorage';

export function useArchitecturalProjects() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['architectural-projects'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      
      // Query for Vitruvius architectural projects (kind 39266)
      const events = await nostr.query([
        { 
          kinds: [VITRUVIUS_KIND], 
          limit: 50 
        }
      ], { signal });

      const projects: ArchitecturalProject[] = [];

      for (const event of events) {
        try {
          const project = parseProjectFromNostrEvent(event.content);
          
          // Ensure we have the event metadata
          const projectWithNostrData: ArchitecturalProject = {
            ...project,
            author: event.pubkey, // Use event author as canonical source
            created_at: event.created_at * 1000, // Convert to milliseconds
            eventId: event.id, // Include Nostr event ID
          };
          
          projects.push(projectWithNostrData);
        } catch (error) {
          console.warn('Failed to parse project from event:', event.id, error);
          // Skip invalid projects
        }
      }

      // Sort by newest first
      return projects.sort((a, b) => b.updated_at - a.updated_at);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useArchitecturalProject(projectId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['architectural-project', projectId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Query for specific project by addressable event identifier
      const events = await nostr.query([
        { 
          kinds: [VITRUVIUS_KIND], 
          '#d': [projectId],
          limit: 1 
        }
      ], { signal });

      if (events.length === 0) {
        throw new Error('Project not found');
      }

      const event = events[0];
      
      try {
        const project = parseProjectFromNostrEvent(event.content);
        
        return {
          ...project,
          author: event.pubkey,
          created_at: event.created_at * 1000,
          eventId: event.id, // Include Nostr event ID
        } as ArchitecturalProject;
      } catch (error) {
        throw new Error('Failed to parse project data');
      }
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}