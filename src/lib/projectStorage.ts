/**
 * Project Storage Service
 * Handles both local file operations and Nostr event management
 */

import { ArchitecturalProject } from '@/types/architecture';

// Nostr event kind for Vitruvius projects
export const VITRUVIUS_KIND = 39266;

/**
 * Generates a unique identifier for Vitruvius projects
 */
export function generateVitruviusId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomSuffix = Array.from(
    { length: 8 }, 
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `vitruvius-${randomSuffix}`;
}

/**
 * Validates if a project has all required fields
 */
export function validateProject(project: unknown): project is ArchitecturalProject {
  if (!project || typeof project !== 'object') return false;
  
  const p = project as Record<string, unknown>;
  const metadata = p.metadata as Record<string, unknown>;
  
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.description === 'string' &&
    typeof p.author === 'string' &&
    typeof p.created_at === 'number' &&
    typeof p.updated_at === 'number' &&
    Array.isArray(p.elements) &&
    metadata &&
    typeof metadata === 'object' &&
    typeof metadata.style === 'string' &&
    typeof metadata.scale === 'number' &&
    Array.isArray(metadata.tags)
  );
}

/**
 * Downloads a project as JSON file to user's computer
 */
export function downloadProjectAsJson(project: ArchitecturalProject): void {
  try {
    const exportData = {
      ...project,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      software: 'Vitruvius Constructions'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(project.name)}.json`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download project:', error);
    throw new Error('Failed to download project file');
  }
}

/**
 * Loads a project from a JSON file
 */
export function loadProjectFromFile(): Promise<ArchitecturalProject> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const project = JSON.parse(content);
          
          if (!validateProject(project)) {
            throw new Error('Invalid project file format');
          }

          // Update metadata for imported project
          const updatedProject: ArchitecturalProject = {
            ...project,
            id: crypto.randomUUID(), // New ID for imported project
            updated_at: Date.now()
          };

          resolve(updatedProject);
        } catch (error) {
          console.error('Failed to parse project file:', error);
          reject(new Error('Failed to load project file. Please check the file format.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * Sanitizes filename for safe file downloads
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'project';
}

/**
 * Creates Nostr event tags for a project
 */
export function createProjectTags(project: ArchitecturalProject, vitruviusId: string): string[][] {
  const tags: string[][] = [
    ['d', vitruviusId],
    ['title', project.name],
    ['description', project.description],
    ['style', project.metadata.style],
    ['scale', project.metadata.scale.toString()],
    ['units', project.metadata.units],
    ['elements', project.elements.length.toString()],
    ['created_at', project.created_at.toString()],
  ];

  // Add tags
  project.metadata.tags.forEach(tag => {
    tags.push(['t', tag.toLowerCase()]);
  });

  return tags;
}

/**
 * Extracts project data from Nostr event content
 */
export function parseProjectFromNostrEvent(content: string): ArchitecturalProject {
  try {
    const project = JSON.parse(content);
    
    if (!validateProject(project)) {
      throw new Error('Invalid project data in Nostr event');
    }

    return project;
  } catch (error) {
    console.error('Failed to parse project from Nostr event:', error);
    throw new Error('Failed to parse project data');
  }
}

/**
 * Error types for better error handling
 */
export class ProjectStorageError extends Error {
  constructor(
    message: string,
    public readonly type: 'file_read' | 'file_write' | 'validation' | 'nostr' | 'unknown'
  ) {
    super(message);
    this.name = 'ProjectStorageError';
  }
}