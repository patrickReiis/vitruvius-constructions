import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera, TransformControls } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import { BuildingElement } from '@/types/architecture';
import { BuildingElementMesh } from './BuildingElementMesh';
import { SceneLoader } from './SceneLoader';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';

interface Scene3DProps {
  elements: BuildingElement[];
  selectedElement?: string | null;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: Partial<BuildingElement>) => void;
  viewMode?: 'perspective' | 'orthographic' | 'top' | 'front' | 'side' | 'custom';
  onCameraMoved?: () => void;
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

// Camera Controller Component to detect camera movement
function CameraController({ 
  viewMode, 
  onCameraMoved,
  orbitControlsRef
}: { 
  viewMode: string;
  onCameraMoved?: () => void;
  orbitControlsRef: React.MutableRefObject<OrbitControlsType | null>;
}) {
  const { camera } = useThree();
  const previousViewMode = useRef(viewMode);

  useEffect(() => {
    if (!orbitControlsRef.current) return;
    const controls = orbitControlsRef.current;
    
    // Step 1: Check if we switched to a new preset view
    const isPresetView = viewMode !== 'custom';
    const viewModeChanged = viewMode !== previousViewMode.current;
    
    if (isPresetView && viewModeChanged) {
      // Step 2: Move camera to the preset position
      const cameraPositions = {
        perspective: { position: [10, 10, 10], target: [0, 2, 0] },
        top: { position: [0, 20, 0], target: [0, 0, 0] },
        front: { position: [0, 5, 15], target: [0, 2, 0] },
        side: { position: [15, 5, 0], target: [0, 2, 0] }
      };
      
      const preset = cameraPositions[viewMode as keyof typeof cameraPositions];
      if (preset) {
        camera.position.set(...preset.position as [number, number, number]);
        controls.target.set(...preset.target as [number, number, number]);
        controls.update();
      }
    }
    
    // Step 3: Listen for manual camera movement
    const handleCameraMove = () => {
      // If we're in a preset view and the camera moves, switch to custom view
      if (viewMode !== 'custom') {
        onCameraMoved?.();
      }
    };
    
    // Add listener after a small delay to avoid triggering on the preset movement
    const timer = setTimeout(() => {
      controls.addEventListener('change', handleCameraMove);
    }, 100);
    
    // Remember current view mode
    previousViewMode.current = viewMode;
    
    // Cleanup
    return () => {
      clearTimeout(timer);
      controls.removeEventListener('change', handleCameraMove);
    };
  }, [camera, viewMode, onCameraMoved, orbitControlsRef]);

  return null;
}

export function Scene3D({ 
  elements, 
  selectedElement, 
  onElementSelect, 
  onElementUpdate,
  viewMode = 'perspective',
  onCameraMoved
}: Scene3DProps) {
  const orbitControls = useRef<OrbitControlsType | null>(null);

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-200 to-sky-100 dark:from-slate-800 dark:to-slate-900">
      <Canvas shadows>
        <Suspense fallback={<SceneLoader />}>
          <PerspectiveCamera 
            makeDefault 
            position={[10, 10, 10]} 
            fov={60}
          />
          
          {/* Camera Controller */}
          <CameraController 
            viewMode={viewMode} 
            onCameraMoved={onCameraMoved}
            orbitControlsRef={orbitControls}
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
            screenSpacePanning={false}
            zoomToCursor={true}
            zoomSpeed={1.5}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}