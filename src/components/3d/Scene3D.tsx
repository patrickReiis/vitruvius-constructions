import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera, TransformControls } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { BuildingElement } from '@/types/architecture';
import { BuildingElementMesh } from './BuildingElementMesh';
import { SceneLoader } from './SceneLoader';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

interface Scene3DProps {
  elements: BuildingElement[];
  selectedElement?: string | null;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: Partial<BuildingElement>) => void;
  viewMode?: 'perspective' | 'orthographic' | 'top' | 'front' | 'side';
}

// Transform Controls Wrapper Component
function TransformControlsWrapper({ 
  selectedElement, 
  onUpdate, 
  orbitControls 
}: { 
  selectedElement: BuildingElement;
  onUpdate?: (elementId: string, updates: Partial<BuildingElement>) => void;
  orbitControls: React.MutableRefObject<OrbitControlsType | null>;
}) {
  const { scene } = useThree();
  
  // Find the selected mesh in the scene
  const selectedMesh = scene.getObjectByName(`element-${selectedElement.id}`);
  
  return selectedMesh ? (
    <TransformControls
      object={selectedMesh}
      mode="translate"
      size={0.8}
      onMouseDown={() => {
        if (orbitControls.current) orbitControls.current.enabled = false;
      }}
      onMouseUp={() => {
        if (orbitControls.current) orbitControls.current.enabled = true;
      }}
      onChange={(e) => {
        if (e && selectedMesh) {
          onUpdate?.(selectedElement.id, {
            position: {
              x: selectedMesh.position.x,
              y: selectedMesh.position.y,
              z: selectedMesh.position.z
            }
          });
        }
      }}
    />
  ) : null;
}

export function Scene3D({ 
  elements, 
  selectedElement, 
  onElementSelect, 
  onElementUpdate,
  viewMode = 'perspective' 
}: Scene3DProps) {
  const orbitControls = useRef<OrbitControlsType | null>(null);
  
  const getCameraPosition = () => {
    switch (viewMode) {
      case 'top':
        return [0, 20, 0] as [number, number, number];
      case 'front':
        return [0, 5, 15] as [number, number, number];
      case 'side':
        return [15, 5, 0] as [number, number, number];
      default:
        return [10, 10, 10] as [number, number, number];
    }
  };

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-200 to-sky-100 dark:from-slate-800 dark:to-slate-900">
      <Canvas shadows>
        <Suspense fallback={<SceneLoader />}>
          <PerspectiveCamera 
            makeDefault 
            position={getCameraPosition()} 
            fov={60}
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          
          {/* Environment */}
          <Environment preset="city" />
          
          {/* Ground Grid */}
          <Grid 
            args={[20, 20]} 
            position={[0, -0.01, 0]} 
            cellSize={1} 
            cellThickness={0.5} 
            cellColor="#6b7280" 
            sectionSize={5} 
            sectionThickness={1} 
            sectionColor="#374151" 
            fadeDistance={25} 
            fadeStrength={1} 
            infiniteGrid 
          />
          
          {/* Building Elements */}
          {elements.map((element) => (
            <BuildingElementMesh
              key={element.id}
              element={element}
              isSelected={selectedElement === element.id}
              onSelect={() => onElementSelect?.(element.id)}
              onUpdate={(updates) => onElementUpdate?.(element.id, updates)}
            />
          ))}
          
          {/* Transform Controls for Selected Element */}
          {selectedElementData && (
            <TransformControlsWrapper
              selectedElement={selectedElementData}
              onUpdate={onElementUpdate}
              orbitControls={orbitControls}
            />
          )}
          
          {/* Controls */}
          <OrbitControls
            ref={orbitControls}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={50}
            target={[0, 2, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}