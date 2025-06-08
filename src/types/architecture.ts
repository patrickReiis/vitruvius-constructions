export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BuildingElement {
  id: string;
  type: 'wall' | 'floor' | 'roof' | 'window' | 'door' | 'column' | 'beam' | 'stairs';
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color: string;
  material: string;
  properties: Record<string, string | number | boolean>;
}

export interface ArchitecturalProject {
  id: string;
  name: string;
  description: string;
  author: string;
  created_at: number;
  updated_at: number;
  elements: BuildingElement[];
  metadata: {
    style: string;
    scale: number;
    units: 'metric' | 'imperial';
    tags: string[];
  };
  eventId?: string; // Optional Nostr event ID for projects loaded from the network
  nostrAddress?: string; // Optional Nostr 'd' tag value for addressable events
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: 'structure' | 'openings' | 'details' | 'landscape';
  elementType: BuildingElement['type'];
}

export interface ViewMode {
  id: string;
  name: string;
  description: string;
  camera: {
    position: Vector3;
    target: Vector3;
  };
}