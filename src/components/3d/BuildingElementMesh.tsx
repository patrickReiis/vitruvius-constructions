import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { BuildingElement } from '@/types/architecture';

interface BuildingElementMeshProps {
  element: BuildingElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BuildingElement>) => void;
}

export function BuildingElementMesh({ 
  element, 
  isSelected, 
  onSelect, 
  onUpdate 
}: BuildingElementMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);



  const getGeometry = () => {
    const { scale } = element;
    
    switch (element.type) {
      case 'wall':
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      case 'floor':
        return <boxGeometry args={[scale.x, 0.1, scale.z]} />;
      case 'roof':
        return <coneGeometry args={[scale.x, scale.y, 4]} />;
      case 'window':
        return <boxGeometry args={[scale.x, scale.y, 0.1]} />;
      case 'door':
        return <boxGeometry args={[scale.x, scale.y, 0.2]} />;
      case 'column':
        return <cylinderGeometry args={[scale.x, scale.x, scale.y, 8]} />;
      case 'beam':
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      case 'stairs':
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const getMaterial = () => {
    const baseColor = isSelected ? '#3b82f6' : hovered ? '#60a5fa' : element.color;
    const opacity = element.type === 'window' ? 0.3 : 1;
    
    return (
      <meshStandardMaterial 
        color={baseColor} 
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.7}
        metalness={0.1}
      />
    );
  };

  return (
    <mesh
      ref={meshRef}
      position={[element.position.x, element.position.y, element.position.z]}
      rotation={[element.rotation.x, element.rotation.y, element.rotation.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      castShadow
      receiveShadow
    >
      {getGeometry()}
      {getMaterial()}
      
      {/* Selection outline */}
      {isSelected && (
        <mesh>
          {getGeometry()}
          <meshBasicMaterial 
            color="#3b82f6" 
            wireframe 
            transparent 
            opacity={0.5} 
          />
        </mesh>
      )}
    </mesh>
  );
}