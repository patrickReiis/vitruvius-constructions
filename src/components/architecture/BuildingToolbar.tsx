import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Square, 
  Triangle, 
  Circle, 
  DoorOpen, 
  RectangleHorizontal,
  ArrowUp,
  Columns3,
  Eye,
  Grid3X3,
  RotateCcw,
  Trash2,
  Copy,
  Move3D
} from 'lucide-react';
import { Tool, BuildingElement } from '@/types/architecture';

interface BuildingToolbarProps {
  selectedTool: string | null;
  onToolSelect: (toolId: string) => void;
  onAddElement: (type: BuildingElement['type']) => void;
  onViewModeChange: (mode: string) => void;
  selectedElement?: BuildingElement;
  onElementAction: (action: 'delete' | 'copy' | 'reset') => void;
}

const structureTools: Tool[] = [
  { id: 'wall', name: 'Wall', icon: 'Square', category: 'structure', elementType: 'wall' },
  { id: 'floor', name: 'Floor', icon: 'RectangleHorizontal', category: 'structure', elementType: 'floor' },
  { id: 'roof', name: 'Roof', icon: 'Triangle', category: 'structure', elementType: 'roof' },
  { id: 'column', name: 'Column', icon: 'Columns3', category: 'structure', elementType: 'column' },
  { id: 'beam', name: 'Beam', icon: 'RectangleHorizontal', category: 'structure', elementType: 'beam' },
];

const openingTools: Tool[] = [
  { id: 'window', name: 'Window', icon: 'Square', category: 'openings', elementType: 'window' },
  { id: 'door', name: 'Door', icon: 'DoorOpen', category: 'openings', elementType: 'door' },
];

const detailTools: Tool[] = [
  { id: 'stairs', name: 'Stairs', icon: 'ArrowUp', category: 'details', elementType: 'stairs' },
];

const viewModes = [
  { id: 'perspective', name: 'Perspective', icon: Eye },
  { id: 'top', name: 'Top View', icon: Grid3X3 },
  { id: 'front', name: 'Front View', icon: Square },
  { id: 'side', name: 'Side View', icon: RectangleHorizontal },
];

export function BuildingToolbar({ 
  selectedTool, 
  onToolSelect, 
  onAddElement, 
  onViewModeChange,
  selectedElement,
  onElementAction
}: BuildingToolbarProps) {
  const [activeTab, setActiveTab] = useState('tools');

  const renderToolButton = (tool: Tool) => {
    const IconComponent = {
      Square,
      Triangle,
      Circle,
      DoorOpen,
      RectangleHorizontal,
      ArrowUp,
      Columns3,
    }[tool.icon as keyof typeof import('lucide-react')] || Square;

    return (
      <Button
        key={tool.id}
        variant={selectedTool === tool.id ? 'default' : 'outline'}
        size="sm"
        className="flex flex-col h-16 w-16 p-2"
        onClick={() => {
          onToolSelect(tool.id);
          onAddElement(tool.elementType);
        }}
      >
        <IconComponent className="h-6 w-6 mb-1" />
        <span className="text-xs">{tool.name}</span>
      </Button>
    );
  };

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Architecture Tools
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Structure
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {structureTools.map(renderToolButton)}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Openings
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {openingTools.map(renderToolButton)}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Details
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {detailTools.map(renderToolButton)}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="view" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Camera Views</h4>
              <div className="grid grid-cols-2 gap-2">
                {viewModes.map((mode) => {
                  const IconComponent = mode.icon;
                  return (
                    <Button
                      key={mode.id}
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-16 p-2"
                      onClick={() => onViewModeChange(mode.id)}
                    >
                      <IconComponent className="h-5 w-5 mb-1" />
                      <span className="text-xs">{mode.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="edit" className="space-y-4">
            {selectedElement ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Selected Element</h4>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
                  </Badge>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onElementAction('copy')}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onElementAction('reset')}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onElementAction('delete')}
                    className="w-full flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                <Move3D className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Select an element to edit
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}