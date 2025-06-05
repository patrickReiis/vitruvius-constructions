/**
 * Hook for querying Vitruvius architectural projects from Nostr
 */

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { ArchitecturalProject } from '@/types/architecture';
import { VITRUVIUS_KIND, parseProjectFromNostrEvent } from '@/lib/projectStorage';

export function useVitruviusProjects() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vitruvius-projects'],
    queryFn: async () => {
      const signal = AbortSignal.timeout(10000); // 10 second timeout
      
      // Query for all Vitruvius projects
      const events = await nostr.query(
        [{ 
          kinds: [VITRUVIUS_KIND],
          limit: 50 // Limit to prevent overwhelming the UI
        }],
        { signal }
      );

      // Parse events into projects
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

/**
 * Hook for querying projects by a specific author
 */
export function useVitruviusProjectsByAuthor(authorPubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vitruvius-projects', 'author', authorPubkey],
    queryFn: async () => {
      const signal = AbortSignal.timeout(5000);
      
      const events = await nostr.query(
        [{ 
          kinds: [VITRUVIUS_KIND],
          authors: [authorPubkey],
          limit: 20
        }],
        { signal }
      );

      const projects: ArchitecturalProject[] = [];
      
      for (const event of events) {
        try {
          const project = parseProjectFromNostrEvent(event.content);
          const projectWithNostrData: ArchitecturalProject = {
            ...project,
            author: event.pubkey,
            created_at: event.created_at * 1000,
            eventId: event.id, // Include Nostr event ID
          };
          
          projects.push(projectWithNostrData);
        } catch (error) {
          console.warn('Failed to parse project from event:', event.id, error);
        }
      }

      return projects.sort((a, b) => b.updated_at - a.updated_at);
    },
    enabled: !!authorPubkey,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for searching projects by tags
 */
export function useVitruviusProjectsByTag(tag: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vitruvius-projects', 'tag', tag],
    queryFn: async () => {
      const signal = AbortSignal.timeout(5000);
      
      const events = await nostr.query(
        [{ 
          kinds: [VITRUVIUS_KIND],
          '#t': [tag.toLowerCase()],
          limit: 30
        }],
        { signal }
      );

      const projects: ArchitecturalProject[] = [];
      
      for (const event of events) {
        try {
          const project = parseProjectFromNostrEvent(event.content);
          const projectWithNostrData: ArchitecturalProject = {
            ...project,
            author: event.pubkey,
            created_at: event.created_at * 1000,
            eventId: event.id, // Include Nostr event ID
          };
          
          projects.push(projectWithNostrData);
        } catch (error) {
          console.warn('Failed to parse project from event:', event.id, error);
        }
      }

      return projects.sort((a, b) => b.updated_at - a.updated_at);
    },
    enabled: !!tag,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}