import { useState, useCallback, useEffect } from 'react';
import { Scene3D } from '@/components/3d/Scene3D';
import { BuildingToolbar } from './BuildingToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { ProjectManager } from './ProjectManager';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useProjectTransfer } from '@/hooks/useProjectTransfer';
import { 
  PanelLeftOpen, 
  PanelRightOpen, 
  Maximize2, 
  Minimize2,
  Info,
  Zap,
  Images
} from 'lucide-react';
import { BuildingElement, ArchitecturalProject } from '@/types/architecture';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';

const defaultProject: ArchitecturalProject = {
  id: crypto.randomUUID(),
  name: 'New Architecture Project',
  description: 'A modern architectural design created with Vitruvius Constructions',
  author: 'anonymous',
  created_at: Date.now(),
  updated_at: Date.now(),
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
};

export function ArchitectureSimulator() {
  const [project, setProject] = useState<ArchitecturalProject>(defaultProject);

  // Handle project transfers from gallery/projects pages
  useProjectTransfer((transferredProject) => {
    setProject(transferredProject);
  });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('perspective');
  const [viewDirection, setViewDirection] = useState<'north' | 'south' | 'east' | 'west'>('south');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { user } = useCurrentUser();
  const navigate = useNavigate();

  // Add ESC key handler to unselect element
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedElement) {
        setSelectedElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedElement]);

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
              onClick={() => navigate('/')}
            >
              <Zap className="h-6 w-6 text-primary" />
              Vitruvius Constructions
            </h1>
            
            <Badge variant="secondary" className="hidden sm:flex">
              {project.elements.length} elements
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/gallery')}
              className="flex items-center gap-1"
            >
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
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
            onElementSelect={setSelectedElement}
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
              </div>
              {selectedElementData && (
                <div className="text-xs text-muted-foreground">
                  💡 Drag to move • ESC to unselect • Use panel for precision
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
                onElementUpdate={updateElement}
              />
            </div>
          </div>
        )}
      </div>
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
    default: return 'concrete';
  }
}