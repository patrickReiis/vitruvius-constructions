import { useRef, useState } from 'react';
import { Mesh } from 'three';
import * as THREE from 'three';
import { BuildingElement, GeometryData } from '@/types/architecture';

interface BuildingElementMeshProps {
  element: BuildingElement;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: (ctrlKey?: boolean) => void;
  onUpdate: (updates: Partial<BuildingElement>) => void;
}

export function BuildingElementMesh({ 
  element, 
  isSelected, 
  isMultiSelected = false,
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
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      case 'roof':
        return <coneGeometry args={[scale.x, scale.y, 4]} />;
      case 'window':
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      case 'door':
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      case 'column':
        return <cylinderGeometry args={[(scale.x + scale.z) / 2, (scale.x + scale.z) / 2, scale.y, 8]} />;
      case 'beam':
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      case 'stairs':
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      case 'custom':
        // For custom elements, use a bounding box geometry
        return <boxGeometry args={[scale.x, scale.y, scale.z]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const getMaterial = () => {
    const baseColor = isSelected 
      ? '#3b82f6' 
      : isMultiSelected 
        ? '#f59e0b' 
        : hovered 
          ? '#60a5fa' 
          : element.color;
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

  const renderCustomElement = () => {
    if (element.type !== 'custom' || !element.children) {
      return null;
    }

    // Check if this is a union (geometric merge) or group (visual grouping)
    const isUnion = element.properties.unionOf;
    const isGroup = element.properties.groupOf;
    const hasCsgGeometry = element.properties.csgGeometry;

    if (isUnion && hasCsgGeometry && element.properties.geometryData) {
      // For CSG unions, render the merged geometry from stored data
      const geometryData = element.properties.geometryData as GeometryData;
      const { positions, indices } = geometryData;
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      if (indices) {
        geometry.setIndex(indices);
      }
      
      geometry.computeVertexNormals();
      
      return (
        <mesh 
          geometry={geometry} 
          castShadow 
          receiveShadow
          scale={[element.scale.x, element.scale.y, element.scale.z]}
        >
          <meshStandardMaterial 
            color={element.color}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      );
    } else if (isUnion) {
      // For simple unions without CSG, render as bounding box
      return null; // The main geometry will be rendered
    } else if (isGroup) {
      // For groups, render child elements relative to the parent position
      return element.children.map((child, index) => (
        <mesh
          key={index}
          position={[child.position.x, child.position.y, child.position.z]}
          rotation={[child.rotation.x, child.rotation.y, child.rotation.z]}
          scale={[child.scale.x, child.scale.y, child.scale.z]}
          castShadow
          receiveShadow
        >
          {getChildGeometry(child)}
          <meshStandardMaterial 
            color={child.color}
            transparent={child.type === 'window'}
            opacity={child.type === 'window' ? 0.3 : 1}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      ));
    }

    return null;
  };

  const getChildGeometry = (child: BuildingElement) => {
    switch (child.type) {
      case 'wall':
      case 'floor':
      case 'window':
      case 'door':
      case 'beam':
      case 'stairs':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'roof':
        return <coneGeometry args={[1, 1, 4]} />;
      case 'column':
        return <cylinderGeometry args={[0.5, 0.5, 1, 8]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      name={`element-${element.id}`}
      position={[element.position.x, element.position.y, element.position.z]}
      rotation={[element.rotation.x, element.rotation.y, element.rotation.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e.nativeEvent.ctrlKey);
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
      {/* Main geometry for non-custom elements or union geometry for union custom elements */}
      {element.type !== 'custom' && (
        <>
          {getGeometry()}
          {getMaterial()}
        </>
      )}
      
      {/* For custom elements */}
      {element.type === 'custom' && (
        <>
          {/* If it's a CSG union, render only the merged geometry (no bounding box) */}
          {element.properties.unionOf && element.properties.csgGeometry && element.properties.geometryData && renderCustomElement()}
          
          {/* If it's a simple union without CSG, render bounding box */}
          {element.properties.unionOf && !element.properties.csgGeometry && (
            <>
              {getGeometry()}
              {getMaterial()}
            </>
          )}
          
          {/* If it's a group, render children */}
          {element.properties.groupOf && renderCustomElement()}
        </>
      )}
      
      {/* Selection outline */}
      {(isSelected || isMultiSelected) && (
        <mesh>
          {/* Use CSG geometry for outline if available, otherwise use standard geometry */}
          {element.type === 'custom' && element.properties.unionOf && element.properties.csgGeometry && element.properties.geometryData ? (
            // For CSG unions, create outline from CSG geometry
            (() => {
              const geometryData = element.properties.geometryData as GeometryData;
              const { positions, indices } = geometryData;
              const outlineGeometry = new THREE.BufferGeometry();
              outlineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
              if (indices) {
                outlineGeometry.setIndex(indices);
              }
              outlineGeometry.computeVertexNormals();
              return <primitive object={outlineGeometry} />;
            })()
          ) : (
            getGeometry()
          )}
          <meshBasicMaterial 
            color={isSelected ? "#3b82f6" : "#f59e0b"} 
            wireframe 
            transparent 
            opacity={0.5} 
          />
        </mesh>
      )}
    </mesh>
  );
}