import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { BuildingElement } from '@/types/architecture';
import { BuildingElementMesh } from './BuildingElementMesh';
import { SceneLoader } from './SceneLoader';

interface Scene3DProps {
  elements: BuildingElement[];
  selectedElement?: string;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: Partial<BuildingElement>) => void;
  viewMode?: 'perspective' | 'orthographic' | 'top' | 'front' | 'side';
}

export function Scene3D({ 
  elements, 
  selectedElement, 
  onElementSelect, 
  onElementUpdate,
  viewMode = 'perspective' 
}: Scene3DProps) {
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
          
          {/* Controls */}
          <OrbitControls
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