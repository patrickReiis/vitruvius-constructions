import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Ruler, RotateCw, Combine, Group, Layers, Minus } from 'lucide-react';
import { BuildingElement } from '@/types/architecture';
import * as THREE from 'three';

interface PropertiesPanelProps {
  selectedElement: BuildingElement | null | undefined;
  selectedElements?: string[];
  onElementUpdate: (elementId: string, updates: Partial<BuildingElement>) => void;
  onCreateGroup?: () => void;
  onCreateUnion?: () => void;
  onCreateIntersection?: () => void;
  onCreateDifference?: () => void;
  elements?: BuildingElement[]; // Need this to check touching
}

const materialOptions = [
  { value: 'concrete', label: 'Concrete', color: '#9ca3af' },
  { value: 'brick', label: 'Brick', color: '#dc2626' },
  { value: 'wood', label: 'Wood', color: '#92400e' },
  { value: 'glass', label: 'Glass', color: '#06b6d4' },
  { value: 'steel', label: 'Steel', color: '#374151' },
  { value: 'stone', label: 'Stone', color: '#78716c' },
];

const colorPresets = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#374151', '#1f2937', '#ffffff'
];

// Helper function to check if two elements are touching (within tolerance)
// See also: src/components/architecture/ArchitectureSimulator.tsx for updated logic!
function areElementsTouching(element1: BuildingElement, element2: BuildingElement, tolerance = 0.1): boolean {
  // Use true geometry-based bounding boxes for accuracy (especially for roofs)
  function getAccurateBox(el: BuildingElement): THREE.Box3 {
    let mesh: THREE.Mesh;
    if (el.type === 'roof') {
      const geometry = new THREE.ConeGeometry(1, 1, 4);
      mesh = new THREE.Mesh(geometry);
      mesh.scale.set(el.scale.x, el.scale.y, el.scale.z);
      mesh.rotation.set(el.rotation.x, el.rotation.y, el.rotation.z);
      mesh.position.set(el.position.x, el.position.y, el.position.z);
    } else {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      mesh = new THREE.Mesh(geometry);
      mesh.scale.set(el.scale.x, el.scale.y, el.scale.z);
      mesh.rotation.set(el.rotation.x, el.rotation.y, el.rotation.z);
      mesh.position.set(el.position.x, el.position.y, el.position.z);
    }
    mesh.updateMatrixWorld();
    const box = new THREE.Box3().setFromObject(mesh);
    box.expandByScalar(tolerance);
    return box;
  }
  const box1 = getAccurateBox(element1);
  const box2 = getAccurateBox(element2);
  return box1.intersectsBox(box2);
}

// Helper function to check if all selected elements are touching each other
function areAllElementsTouching(elements: BuildingElement[], tolerance = 0.1): boolean {
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

export function PropertiesPanel({ 
  selectedElement, 
  selectedElements = [], 
  onElementUpdate, 
  onCreateGroup,
  onCreateUnion,
  onCreateIntersection,
  onCreateDifference,
  elements = []
}: PropertiesPanelProps) {
  const [localValues, setLocalValues] = useState<Partial<BuildingElement>>({});

  // Show multi-selection UI if multiple elements are selected
  if (selectedElements.length > 1) {
    // Get the actual element objects
    const selectedElementObjects = elements.filter(el => selectedElements.includes(el.id));
    const areTouching = areAllElementsTouching(selectedElementObjects);

    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Multi-Selection
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedElements.length} elements selected
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              {selectedElements.length} Elements
            </Badge>
            <p className="text-sm text-muted-foreground mb-4">
              Hold Ctrl and click elements to multi-select
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={onCreateGroup}
              className="w-full gap-2"
              variant="outline"
              disabled={selectedElements.length < 2}
            >
              <Group className="h-4 w-4" />
              Create Group
            </Button>
            
            <Button
              onClick={onCreateUnion}
              className="w-full gap-2"
              disabled={selectedElements.length < 2 || !areTouching}
            >
              <Combine className="h-4 w-4" />
              Create Union
            </Button>

            <Button
              onClick={onCreateIntersection}
              className="w-full gap-2"
              disabled={selectedElements.length < 2 || !areTouching}
            >
              <Layers className="h-4 w-4" />
              Create Intersection
            </Button>

            <Button
              onClick={onCreateDifference}
              className="w-full gap-2"
              disabled={selectedElements.length !== 2 || !areTouching}
            >
              <Minus className="h-4 w-4" />
              Create Difference (1st - 2nd)
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• <strong>Group:</strong> Visual grouping of elements</div>
            <div>• <strong>Union:</strong> Geometric merge of touching objects</div>
            <div>• <strong>Intersection:</strong> Common overlapping volume of touching objects</div>
            <div>• <strong>Difference:</strong> Subtract the second element from the first (only with 2 elements)</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedElement) {
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select an element to view properties</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updateElement = (updates: Partial<BuildingElement>) => {
    onElementUpdate(selectedElement.id, updates);
    setLocalValues({});
  };

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    updateElement({
      position: {
        ...selectedElement.position,
        [axis]: value
      }
    });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    updateElement({
      scale: {
        ...selectedElement.scale,
        [axis]: value
      }
    });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    updateElement({
      rotation: {
        ...selectedElement.rotation,
        [axis]: (value * Math.PI) / 180 // Convert degrees to radians
      }
    });
  };

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Properties
        </CardTitle>
        <p className="text-sm text-muted-foreground capitalize">
          {selectedElement.type} Element
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Position Controls */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Ruler className="h-4 w-4" />
            Position
          </Label>
          <div className="space-y-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <Label className="w-4 text-xs font-mono uppercase">{axis}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedElement.position[axis]}
                  onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Scale Controls */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Ruler className="h-4 w-4" />
            Scale
          </Label>
          <div className="space-y-3">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-mono uppercase">{axis}</Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedElement.scale[axis].toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[selectedElement.scale[axis]]}
                  onValueChange={([value]) => handleScaleChange(axis, value)}
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rotation Controls */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <RotateCw className="h-4 w-4" />
            Rotation (degrees)
          </Label>
          <div className="space-y-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <Label className="w-4 text-xs font-mono uppercase">{axis}</Label>
                <Input
                  type="number"
                  step="1"
                  value={Math.round((selectedElement.rotation[axis] * 180) / Math.PI)}
                  onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Material and Color */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4" />
            Appearance
          </Label>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Material</Label>
              <Select
                value={selectedElement.material}
                onValueChange={(value) => updateElement({ material: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materialOptions.map((material) => (
                    <SelectItem key={material.value} value={material.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: material.color }}
                        />
                        {material.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Color</Label>
              <div className="grid grid-cols-6 gap-1">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      selectedElement.color === color 
                        ? 'border-primary scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateElement({ color })}
                  />
                ))}
              </div>
              
              <div className="mt-2">
                <Input
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => updateElement({ color: e.target.value })}
                  className="w-full h-8"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => updateElement({
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            })}
          >
            Reset Transform
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}