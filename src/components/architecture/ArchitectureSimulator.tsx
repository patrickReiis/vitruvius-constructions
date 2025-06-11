import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scene3D } from '@/components/3d/Scene3D';
import { BuildingToolbar } from './BuildingToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { ProjectManager } from './ProjectManager';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useProjectTransfer } from '@/hooks/useProjectTransfer';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useUnsavedChangesDialog } from './UnsavedChangesDialog';
import { setWorkingProject, markProjectAsSaved } from '@/hooks/useProjectManager';
import * as THREE from 'three';
import { 
  PanelLeftOpen, 
  PanelRightOpen, 
  Maximize2, 
  Minimize2,
  Info,
  Zap,
  Images
} from 'lucide-react';
import { BuildingElement, ArchitecturalProject, GeometryData } from '@/types/architecture';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// Helper function to check if two elements are touching (within tolerance)
function areElementsTouching(element1: BuildingElement, element2: BuildingElement, tolerance = 0.01): boolean {
  // For accuracy, use true geometry-based bounding boxes for roofs (cones)
  function getAccurateBox(el: BuildingElement): THREE.Box3 {
    let mesh: THREE.Mesh;
    if (el.type === 'roof') {
      // Use ConeGeometry
      const geometry = new THREE.ConeGeometry(1, 1, 4);
      mesh = new THREE.Mesh(geometry);
      mesh.scale.set(el.scale.x, el.scale.y, el.scale.z);
      mesh.rotation.set(el.rotation.x, el.rotation.y, el.rotation.z);
      mesh.position.set(el.position.x, el.position.y, el.position.z);
    } else {
      // For other, default to box using scale/rotation/position
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      mesh = new THREE.Mesh(geometry);
      mesh.scale.set(el.scale.x, el.scale.y, el.scale.z);
      mesh.rotation.set(el.rotation.x, el.rotation.y, el.rotation.z);
      mesh.position.set(el.position.x, el.position.y, el.position.z);
    }
    mesh.updateMatrixWorld();
    const box = new THREE.Box3().setFromObject(mesh);
    // Expand by tolerance for numerical forgiveness
    box.expandByScalar(tolerance);
    return box;
  }

  const box1 = getAccurateBox(element1);
  const box2 = getAccurateBox(element2);
  return box1.intersectsBox(box2);
}


// Helper function to check if all selected elements are touching each other
function areAllElementsTouching(elements: BuildingElement[], tolerance = 0.01): boolean {
  if (elements.length < 2) return false;
  
  // Check if each element touches at least one other element
  for (let i = 0; i < elements.length; i++) {
    let touchesAnother = false;
    for (let j = 0; j < elements.length; j++) {
      if (i !== j && areElementsTouching(elements[i], elements[j], tolerance)) {
        touchesAnother = true;
        break;
      }
    }
    if (!touchesAnother) return false;
  }
  
  return true;
}

// Helper function to create Three.js geometry from BuildingElement (including CSG elements)
function createThreeGeometryForCSG(element: BuildingElement): THREE.BufferGeometry {
  // If this is a CSG union element, use its stored geometry
  if (element.type === 'custom' && element.properties.unionOf && element.properties.csgGeometry && element.properties.geometryData) {
    const geometryData = element.properties.geometryData as GeometryData;
    const { positions, indices } = geometryData;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    if (indices) {
      geometry.setIndex(indices);
    }
    
    geometry.computeVertexNormals();
    
    // The stored geometry is already at the correct size and centered
    // No additional scaling needed here
    return geometry;
  }
  
  // Otherwise use standard geometry creation
  return createThreeGeometry(element);
}
function createThreeGeometry(element: BuildingElement): THREE.BufferGeometry {
  const { scale } = element;
  
  switch (element.type) {
    case 'wall':
    case 'floor':
    case 'window':
    case 'door':
    case 'beam':
    case 'stairs':
      return new THREE.BoxGeometry(scale.x, scale.y, scale.z);
    
    case 'roof':
      return new THREE.ConeGeometry(scale.x, scale.y, 4);
    
    case 'column':
      return new THREE.CylinderGeometry(
        (scale.x + scale.z) / 4, // top radius
        (scale.x + scale.z) / 4, // bottom radius  
        scale.y, // height
        8 // segments
      );
    
    default:
      return new THREE.BoxGeometry(scale.x, scale.y, scale.z);
  }
}

// Helper function to create a mesh with proper positioning
function createPositionedMesh(element: BuildingElement): THREE.Mesh {
  const geometry = createThreeGeometry(element);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  
  mesh.position.set(element.position.x, element.position.y, element.position.z);
  mesh.rotation.set(element.rotation.x, element.rotation.y, element.rotation.z);
  
  return mesh;
}
const getOrCreateDefaultProjectId = () => {
  const storageKey = 'vitruvius-default-project-id';
  let projectId = localStorage.getItem(storageKey);
  
  if (!projectId) {
    projectId = crypto.randomUUID();
    localStorage.setItem(storageKey, projectId);
  }
  
  return projectId;
};

const createDefaultProject = (): ArchitecturalProject => {
  const now = Date.now();
  const defaultProject = {
    id: getOrCreateDefaultProjectId(),
    name: 'New Architecture Project',
    description: 'A modern architectural design created with Vitruvius Constructions',
    author: 'anonymous',
    created_at: now,
    updated_at: now,
    elements: [
      // Sample floor
      {
        id: crypto.randomUUID(),
        type: 'floor',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 8, y: 0.2, z: 8 },
        color: '#e5e7eb',
        material: 'concrete',
        properties: {}
      },
      // Sample walls
      {
        id: crypto.randomUUID(),
        type: 'wall',
        position: { x: -4, y: 1.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.2, y: 3, z: 8 },
        color: '#f3f4f6',
        material: 'concrete',
        properties: {}
      },
      {
        id: crypto.randomUUID(),
        type: 'wall',
        position: { x: 4, y: 1.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.2, y: 3, z: 8 },
        color: '#f3f4f6',
        material: 'concrete',
        properties: {}
      }
    ],
    metadata: {
      style: 'Modern',
      scale: 1,
      units: 'metric',
      tags: ['sample', 'modern', 'residential']
    }
  } as ArchitecturalProject;
  
  // Mark the default project as saved initially (since it starts with sample content)
  markProjectAsSaved(defaultProject);
  
  return defaultProject;
};

export function ArchitectureSimulator({ 
  onUnsavedChangesReady 
}: { 
  onUnsavedChangesReady?: (context: { checkUnsavedChangesBeforeAction: (action: () => void, showDialog?: (action: () => void) => void) => void, hasUnsavedChanges: boolean }) => void 
} = {}) {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const { toast } = useToast();
  
  // Initialize project state with a function to avoid recreating default project on every render
  const [project, setProject] = useState<ArchitecturalProject>(() => {
    // Check if we have a projectId in the URL
    if (projectId) {
      // Create a project with the specified ID
      // The actual project data will be loaded via project transfer or from saved state
      const urlProject = {
        id: projectId,
        name: 'New Architecture Project',
        description: 'A modern architectural design created with Vitruvius Constructions',
        author: user?.pubkey || 'anonymous',
        created_at: Date.now(),
        updated_at: Date.now(),
        elements: [],
        metadata: {
          style: 'Modern',
          scale: 1,
          units: 'metric',
          tags: ['sample', 'modern', 'residential']
        }
      } as ArchitecturalProject;
      
      // Mark empty URL project as saved (it's just a placeholder)
      markProjectAsSaved(urlProject);
      return urlProject;
    }
    
    // Otherwise create a default project (already marked as saved)
    return createDefaultProject();
  });

  // Handle project transfers from gallery/projects pages
  useProjectTransfer((transferredProject) => {
    setProject(transferredProject);
    // Mark transferred project as saved (since it was loaded from somewhere)
    markProjectAsSaved(transferredProject);
    // Update the URL to reflect the new project
    navigate(`/create/${transferredProject.id}`, { replace: true });
  });

  // Set up unsaved changes warning with React dialog
  const { 
    isOpen: isDialogOpen, 
    showDialog, 
    handleConfirm, 
    handleCancel, 
    Dialog: UnsavedChangesDialog 
  } = useUnsavedChangesDialog();

  const { hasUnsavedChanges: hasChanges, safeNavigate, checkUnsavedChangesBeforeAction } = useUnsavedChangesWarning({
    project,
    enabled: true
  });

  // Notify parent about unsaved changes functionality
  useEffect(() => {
    if (onUnsavedChangesReady) {
      onUnsavedChangesReady({ checkUnsavedChangesBeforeAction, hasUnsavedChanges: hasChanges });
    }
  }, [checkUnsavedChangesBeforeAction, hasChanges, onUnsavedChangesReady]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]); // For multi-selection
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('perspective');
  const [viewDirection, setViewDirection] = useState<'north' | 'south' | 'east' | 'west'>('south');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update the URL when project changes and track working project
  useEffect(() => {
    if (project.id && !window.location.pathname.includes(project.id)) {
      navigate(`/create/${project.id}`, { replace: true });
    }
    // Update working project for unsaved changes tracking
    setWorkingProject(project);
  }, [project.id, project, navigate]);

  // Handle view mode changes with toggle logic
  const handleViewModeChange = useCallback((mode: string) => {
    if (mode === viewMode && (mode === 'front' || mode === 'side')) {
      // Toggle direction if clicking the same front/side view
      if (mode === 'front') {
        setViewDirection(viewDirection === 'south' ? 'north' : 'south');
      } else if (mode === 'side') {
        setViewDirection(viewDirection === 'east' ? 'west' : 'east');
      }
    } else {
      // Reset to default directions when switching to a new view
      if (mode === 'front') {
        setViewDirection('south');
      } else if (mode === 'side') {
        setViewDirection('east');
      }
    }
    setViewMode(mode);
  }, [viewMode, viewDirection]);

  const selectedElementData = selectedElement 
    ? project.elements.find(el => el.id === selectedElement) 
    : null;

  const addElement = useCallback((type: BuildingElement['type']) => {
    const newElement: BuildingElement = {
      id: crypto.randomUUID(),
      type,
      position: { x: 0, y: getDefaultHeight(type), z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: getDefaultScale(type),
      color: getDefaultColor(type),
      material: getDefaultMaterial(type),
      properties: {}
    };

    setProject(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      updated_at: Date.now()
    }));

    setSelectedElement(newElement.id);
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<BuildingElement>) => {
    setProject(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      ),
      updated_at: Date.now()
    }));
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setProject(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
      updated_at: Date.now()
    }));
    
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  // Add keyboard shortcuts for element manipulation (must be after deleteElement is defined)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedElement) {
          setSelectedElement(null);
        }
        if (selectedElements.length > 0) {
          setSelectedElements([]);
        }
      }
      
      if (event.key === 'Delete') {
        if (selectedElement) {
          deleteElement(selectedElement);
        }
        // For multi-selection, delete all selected elements
        if (selectedElements.length > 0) {
          selectedElements.forEach(elementId => deleteElement(elementId));
          setSelectedElements([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedElement, selectedElements, deleteElement]);

  const copyElement = useCallback((elementId: string) => {
    const element = project.elements.find(el => el.id === elementId);
    if (!element) return;

    const newElement: BuildingElement = {
      ...element,
      id: crypto.randomUUID(),
      position: {
        ...element.position,
        x: element.position.x + 1,
        z: element.position.z + 1
      }
    };

    setProject(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      updated_at: Date.now()
    }));

    setSelectedElement(newElement.id);
  }, [project.elements]);

  const resetElement = useCallback((elementId: string) => {
    const element = project.elements.find(el => el.id === elementId);
    if (!element) return;

    updateElement(elementId, {
      rotation: { x: 0, y: 0, z: 0 },
      scale: getDefaultScale(element.type),
      color: getDefaultColor(element.type)
    });
  }, [project.elements, updateElement]);

  const handleElementSelect = useCallback((elementId: string, ctrlKey?: boolean) => {
    if (ctrlKey) {
      // Multi-selection with Ctrl+click
      if (selectedElements.includes(elementId)) {
        // Remove from selection
        setSelectedElements(prev => prev.filter(id => id !== elementId));
      } else {
        // Add to selection
        setSelectedElements(prev => [...prev, elementId]);
        // Clear single selection when first multi-select happens
        if (selectedElement && !selectedElements.includes(selectedElement)) {
          setSelectedElement(null);
        }
      }
    } else {
      // Single selection (normal click)
      setSelectedElement(elementId);
      setSelectedElements([]); // Clear multi-selection
    }
  }, [selectedElement, selectedElements]);

  const createGroup = useCallback(() => {
    if (selectedElements.length < 2) return;

    // Get the selected elements
    const elementsToGroup = project.elements.filter(el => selectedElements.includes(el.id));
    
    // Calculate bounding box center for the group position
    const positions = elementsToGroup.map(el => el.position);
    const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
    const centerZ = positions.reduce((sum, pos) => sum + pos.z, 0) / positions.length;

    // Create the group element
    const groupElement: BuildingElement = {
      id: crypto.randomUUID(),
      type: 'custom',
      position: { x: centerX, y: centerY, z: centerZ },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: elementsToGroup[0].color, // Use first element's color
      material: elementsToGroup[0].material, // Use first element's material
      properties: { groupOf: selectedElements.join(',') },
      children: elementsToGroup.map(el => ({
        ...el,
        // Adjust child positions relative to the group center
        position: {
          x: el.position.x - centerX,
          y: el.position.y - centerY,
          z: el.position.z - centerZ
        }
      }))
    };

    // Remove original elements and add group
    setProject(prev => ({
      ...prev,
      elements: [
        ...prev.elements.filter(el => !selectedElements.includes(el.id)),
        groupElement
      ],
      updated_at: Date.now()
    }));

    // Clear multi-selection and select the new group
    setSelectedElements([]);
    setSelectedElement(groupElement.id);
  }, [selectedElements, project.elements]);

  // Flatten a list of elements to all underlying primitives (recursively)
  const flattenToPrimitives = useCallback((elements: BuildingElement[]): BuildingElement[] => {
    const result: BuildingElement[] = [];
    for (const el of elements) {
      if (
        el.type === 'custom' &&
        (el.properties.unionOf || el.properties.groupOf) &&
        el.children && el.children.length > 0
      ) {
        // Recursively flatten children
        result.push(...flattenToPrimitives(el.children));
      } else {
        result.push(el);
      }
    }
    return result;
  }, []);

  const createUnion = useCallback(async () => {
    if (selectedElements.length < 2) return;

    try {
      // Get the selected elements (can include custom union/group)
      const elementsToUnion = project.elements.filter(el => selectedElements.includes(el.id));

      // Flatten all recursive children down to primitives
      const primitiveElements = flattenToPrimitives(elementsToUnion);

      // Check if all primitives are touching
      const areTouching = areAllElementsTouching(primitiveElements);
      if (!areTouching) {
        toast({
          title: "Union Failed",
          description: "Elements must be touching or overlapping to create a union.",
          variant: "destructive"
        });
        return;
      }

      // Import CSG library dynamically
      const { ADDITION, INTERSECTION, Evaluator, Brush } = await import('three-bvh-csg');

      // Create CSG brushes for primitive operations
      const brushes = primitiveElements.map(element => {
        let geometry: THREE.BufferGeometry;

        switch (element.type) {
          case 'wall':
          case 'floor':
          case 'window':
          case 'door':
          case 'beam':
          case 'stairs':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
          case 'roof':
            geometry = new THREE.ConeGeometry(1, 1, 4);
            break;
          case 'column':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
            break;
          default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        const brush = new Brush(geometry);
        brush.scale.set(element.scale.x, element.scale.y, element.scale.z);
        brush.rotation.set(element.rotation.x, element.rotation.y, element.rotation.z);
        brush.position.set(element.position.x, element.position.y, element.position.z);
        brush.updateMatrixWorld();
        return brush;
      });

      // Perform boolean union
      const evaluator = new Evaluator();
      let resultBrush = brushes[0];
      for (let i = 1; i < brushes.length; i++) {
        resultBrush = evaluator.evaluate(resultBrush, brushes[i], ADDITION);
      }

      // Get the merged geometry
      const mergedGeometry = resultBrush.geometry.clone();
      mergedGeometry.computeBoundingBox();
      const boundingBox = mergedGeometry.boundingBox!;
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      boundingBox.getCenter(center);
      boundingBox.getSize(size);

      // Normalize
      mergedGeometry.translate(-center.x, -center.y, -center.z);
      mergedGeometry.scale(1 / size.x, 1 / size.y, 1 / size.z);

      const positions = mergedGeometry.attributes.position.array;
      const indices = mergedGeometry.index?.array;

      // New union element: children is a flattened copy of all primitives used, but preserve input hierarchy inside .properties.originalElements for reference if needed
      const unionElement: BuildingElement = {
        id: crypto.randomUUID(),
        type: 'custom',
        position: { x: center.x, y: center.y, z: center.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: size.x, y: size.y, z: size.z },
        color: primitiveElements[0].color,
        material: primitiveElements[0].material,
        properties: {
          unionOf: selectedElements.join(','),
          csgGeometry: true,
          geometryData: {
            positions: Array.from(positions),
            indices: indices ? Array.from(indices) : undefined
          },
          // Keep full source structure, for history/debug/audit
          originalElements: JSON.stringify(elementsToUnion) // as plain data to avoid deep object cycles
        },
        children: primitiveElements.map(e => ({ ...e }))
      };

      setProject(prev => ({
        ...prev,
        elements: [
          ...prev.elements.filter(el => !selectedElements.includes(el.id)),
          unionElement
        ],
        updated_at: Date.now()
      }));

      setSelectedElements([]);
      setSelectedElement(unionElement.id);

      toast({
        title: "Union Created",
        description: `Successfully merged ${primitiveElements.length} primitives using CSG boolean union.`
      });

      brushes.forEach(brush => brush.geometry.dispose());

    } catch (error) {
      console.error('CSG Union creation failed:', error);
      toast({
        title: "Union Failed",
        description: "Could not create CSG union. Elements may have incompatible geometry or overlapping issues.",
        variant: "destructive"
      });
    }
  }, [selectedElements, project.elements, toast, flattenToPrimitives]);

  const createIntersection = useCallback(async () => {
    if (selectedElements.length < 2) return;

    try {
      // Get the selected elements (can include custom union/group)
      const elementsToIntersect = project.elements.filter(el => selectedElements.includes(el.id));

      // Flatten all recursive children down to primitives
      const primitiveElements = flattenToPrimitives(elementsToIntersect);

      // Check if all primitives are touching (intersection requires overlapping geometry)
      const areTouching = areAllElementsTouching(primitiveElements);
      if (!areTouching) {
        toast({
          title: "Intersection Failed",
          description: "Elements must be touching or overlapping to create an intersection.",
          variant: "destructive"
        });
        return;
      }

      // Import CSG library dynamically
      const { INTERSECTION, Evaluator, Brush } = await import('three-bvh-csg');

      // Create CSG brushes for primitive operations
      const brushes = primitiveElements.map(element => {
        let geometry: THREE.BufferGeometry;

        switch (element.type) {
          case 'wall':
          case 'floor':
          case 'window':
          case 'door':
          case 'beam':
          case 'stairs':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
          case 'roof':
            geometry = new THREE.ConeGeometry(1, 1, 4);
            break;
          case 'column':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
            break;
          default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        const brush = new Brush(geometry);
        brush.scale.set(element.scale.x, element.scale.y, element.scale.z);
        brush.rotation.set(element.rotation.x, element.rotation.y, element.rotation.z);
        brush.position.set(element.position.x, element.position.y, element.position.z);
        brush.updateMatrixWorld();
        return brush;
      });

      // Perform boolean intersection
      const evaluator = new Evaluator();
      let resultBrush = brushes[0];
      for (let i = 1; i < brushes.length; i++) {
        resultBrush = evaluator.evaluate(resultBrush, brushes[i], INTERSECTION);
      }

      // Check if the intersection result is valid (has volume)
      if (!resultBrush.geometry || resultBrush.geometry.attributes.position.count === 0) {
        toast({
          title: "Intersection Failed",
          description: "The selected elements do not have overlapping geometry to create a meaningful intersection.",
          variant: "destructive"
        });
        return;
      }

      // Get the intersected geometry
      const intersectedGeometry = resultBrush.geometry.clone();
      intersectedGeometry.computeBoundingBox();
      const boundingBox = intersectedGeometry.boundingBox!;
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      boundingBox.getCenter(center);
      boundingBox.getSize(size);

      // Check if the resulting geometry has meaningful size
      if (size.x < 0.01 || size.y < 0.01 || size.z < 0.01) {
        toast({
          title: "Intersection Failed",
          description: "The intersection between selected elements is too small or empty.",
          variant: "destructive"
        });
        return;
      }

      // Normalize
      intersectedGeometry.translate(-center.x, -center.y, -center.z);
      intersectedGeometry.scale(1 / size.x, 1 / size.y, 1 / size.z);

      const positions = intersectedGeometry.attributes.position.array;
      const indices = intersectedGeometry.index?.array;

      // New intersection element: children is a flattened copy of all primitives used
      const intersectionElement: BuildingElement = {
        id: crypto.randomUUID(),
        type: 'custom',
        position: { x: center.x, y: center.y, z: center.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: size.x, y: size.y, z: size.z },
        color: primitiveElements[0].color,
        material: primitiveElements[0].material,
        properties: {
          intersectionOf: selectedElements.join(','),
          csgGeometry: true,
          geometryData: {
            positions: Array.from(positions),
            indices: indices ? Array.from(indices) : undefined
          },
          // Keep full source structure, for history/debug/audit
          originalElements: JSON.stringify(elementsToIntersect) // as plain data to avoid deep object cycles
        },
        children: primitiveElements.map(e => ({ ...e }))
      };

      setProject(prev => ({
        ...prev,
        elements: [
          ...prev.elements.filter(el => !selectedElements.includes(el.id)),
          intersectionElement
        ],
        updated_at: Date.now()
      }));

      setSelectedElements([]);
      setSelectedElement(intersectionElement.id);

      toast({
        title: "Intersection Created",
        description: `Successfully created intersection of ${primitiveElements.length} primitives using CSG boolean intersection.`
      });

      brushes.forEach(brush => brush.geometry.dispose());

    } catch (error) {
      console.error('CSG Intersection creation failed:', error);
      toast({
        title: "Intersection Failed",
        description: "Could not create CSG intersection. Elements may have incompatible geometry or no overlapping volume.",
        variant: "destructive"
      });
    }
  }, [selectedElements, project.elements, toast, flattenToPrimitives]);


  const handleElementAction = useCallback((action: 'delete' | 'copy' | 'reset') => {
    if (!selectedElement) return;

    switch (action) {
      case 'delete':
        deleteElement(selectedElement);
        break;
      case 'copy':
        copyElement(selectedElement);
        break;
      case 'reset':
        resetElement(selectedElement);
        break;
    }
  }, [selectedElement, deleteElement, copyElement, resetElement]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    } else {
      setLeftPanelOpen(true);
      setRightPanelOpen(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 
              className="text-xl font-bold flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" 
              onClick={() => safeNavigate('/', undefined, showDialog)}
            >
              <Zap className="h-6 w-6 text-primary" />
              Vitruvius Constructions
            </h1>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:flex">
                {project.elements.length} elements
              </Badge>
              
              {hasChanges && (
                <Badge variant="destructive" className="hidden sm:flex">
                  Unsaved
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => safeNavigate('/projects', undefined, showDialog)}
              className="flex items-center gap-1"
            >
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">Your Projects</span>
            </Button>

            {!isFullscreen && (
              <>
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  className="hidden lg:flex"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="hidden lg:flex"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6 hidden lg:block" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            <div className="scale-100">
              <LoginArea />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        {leftPanelOpen && !isFullscreen && (
          <div className="border-r bg-card flex flex-col">
            <div className="px-4 py-4 space-y-4 overflow-y-auto flex-1">
              <ProjectManager
                project={project}
                onProjectUpdate={(updates) => setProject(prev => ({ ...prev, ...updates }))}
                onProjectLoad={setProject}
              />
              
              <BuildingToolbar
                selectedTool={selectedTool}
                onToolSelect={setSelectedTool}
                onAddElement={addElement}
                onViewModeChange={handleViewModeChange}
                selectedElement={selectedElementData}
                onElementAction={handleElementAction}
              />
            </div>
          </div>
        )}

        {/* 3D Scene */}
        <div className="flex-1 relative z-0 min-w-0">
          <Scene3D
            elements={project.elements}
            selectedElement={selectedElement}
            selectedElements={selectedElements}
            onElementSelect={handleElementSelect}
            onElementUpdate={updateElement}
            viewMode={viewMode as 'perspective' | 'orthographic' | 'top' | 'front' | 'side' | 'custom'}
            viewDirection={viewDirection}
            onCameraMoved={() => setViewMode('custom')}
          />
          
          {/* Scene Info Overlay */}
          <Card className="absolute top-4 left-4 p-3 bg-background/80 backdrop-blur-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                <span>
                  {viewMode === 'custom' ? 'Custom View' : `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View`}
                </span>
                {selectedElementData && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="outline" className="text-xs">
                      {selectedElementData.type}
                    </Badge>
                  </>
                )}
                {selectedElements.length > 1 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      {selectedElements.length} selected
                    </Badge>
                  </>
                )}
              </div>
              {selectedElementData && selectedElements.length <= 1 && (
                <div className="text-xs text-muted-foreground">
                  💡 Drag to move • ESC to unselect • DEL to delete • Use panel for precision
                </div>
              )}
              {selectedElements.length > 1 && (
                <div className="text-xs text-muted-foreground">
                  💡 Ctrl+click to multi-select • ESC to clear • DEL to delete all • Group/Union in panel
                </div>
              )}
            </div>
          </Card>

          {/* Mobile Controls */}
          {(isFullscreen || window.innerWidth < 1024) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Card className="p-2 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel */}
        {rightPanelOpen && !isFullscreen && (
          <div className="border-l bg-card">
            <div className="p-4">
              <PropertiesPanel
                selectedElement={selectedElementData}
                selectedElements={selectedElements}
                onElementUpdate={updateElement}
                onCreateGroup={createGroup}
                onCreateUnion={createUnion}
                onCreateIntersection={createIntersection}
                elements={project.elements}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog 
        isOpen={isDialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

// Helper functions
function getDefaultHeight(type: BuildingElement['type']): number {
  switch (type) {
    case 'floor': return 0;
    case 'wall': return 1.5;
    case 'roof': return 3.5;
    case 'window': return 1.5;
    case 'door': return 1;
    case 'column': return 1.5;
    case 'beam': return 3;
    case 'stairs': return 0.5;
    case 'custom': return 2;
    default: return 1;
  }
}

function getDefaultScale(type: BuildingElement['type']): { x: number; y: number; z: number } {
  switch (type) {
    case 'wall': return { x: 0.2, y: 3, z: 4 };
    case 'floor': return { x: 4, y: 0.2, z: 4 };
    case 'roof': return { x: 2, y: 1, z: 2 };
    case 'window': return { x: 1.5, y: 1.5, z: 0.1 };
    case 'door': return { x: 1, y: 2, z: 0.1 };
    case 'column': return { x: 0.3, y: 3, z: 0.3 };
    case 'beam': return { x: 4, y: 0.3, z: 0.3 };
    case 'stairs': return { x: 2, y: 1, z: 3 };
    case 'custom': return { x: 2, y: 2, z: 2 };
    default: return { x: 1, y: 1, z: 1 };
  }
}

function getDefaultColor(type: BuildingElement['type']): string {
  switch (type) {
    case 'wall': return '#f3f4f6';
    case 'floor': return '#e5e7eb';
    case 'roof': return '#dc2626';
    case 'window': return '#06b6d4';
    case 'door': return '#92400e';
    case 'column': return '#6b7280';
    case 'beam': return '#374151';
    case 'stairs': return '#78716c';
    case 'custom': return '#8b5cf6';
    default: return '#9ca3af';
  }
}

function getDefaultMaterial(type: BuildingElement['type']): string {
  switch (type) {
    case 'wall': return 'concrete';
    case 'floor': return 'concrete';
    case 'roof': return 'brick';
    case 'window': return 'glass';
    case 'door': return 'wood';
    case 'column': return 'concrete';
    case 'beam': return 'steel';
    case 'stairs': return 'stone';
    case 'custom': return 'concrete';
    default: return 'concrete';
  }
}