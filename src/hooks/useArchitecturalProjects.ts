import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { ArchitecturalProject } from '@/types/architecture';

export function useArchitecturalProjects() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['architectural-projects'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Query for architectural projects (kind 30023 with architecture tags)
      const events = await nostr.query([
        { 
          kinds: [30023], 
          '#t': ['architecture', '3d-design'],
          limit: 50 
        }
      ], { signal });

      const projects: ArchitecturalProject[] = [];

      for (const event of events) {
        try {
          const projectData = JSON.parse(event.content);
          
          // Validate that it's an architectural project
          if (projectData.elements && Array.isArray(projectData.elements)) {
            projects.push({
              ...projectData,
              author: event.pubkey,
              created_at: event.created_at * 1000, // Convert to milliseconds
              updated_at: event.created_at * 1000
            });
          }
        } catch (error) {
          console.warn('Failed to parse architectural project:', error);
        }
      }

      // Sort by creation date (newest first)
      return projects.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

export function useArchitecturalProject(projectId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['architectural-project', projectId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Query for specific project by replaceable event identifier
      const events = await nostr.query([
        { 
          kinds: [30023], 
          '#d': [projectId],
          limit: 1 
        }
      ], { signal });

      if (events.length === 0) {
        throw new Error('Project not found');
      }

      const event = events[0];
      
      try {
        const projectData = JSON.parse(event.content);
        
        return {
          ...projectData,
          author: event.pubkey,
          created_at: event.created_at * 1000,
          updated_at: event.created_at * 1000
        } as ArchitecturalProject;
      } catch (error) {
        throw new Error('Failed to parse project data');
      }
    },
    enabled: !!projectId,
    staleTime: 60000,
    gcTime: 300000,
  });
}