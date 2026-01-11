'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Html, useGLTF } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import {
  Move,
  RotateCw,
  Scale,
  Box,
  Circle,
  Square,
  Lightbulb,
  Save,
  Undo,
  Redo,
  Trash2
} from 'lucide-react';
import * as THREE from 'three';

interface SceneEditorProps {
  initialModelUrl?: string;
  onSave?: (sceneData: any) => void;
  onSaveRef?: React.MutableRefObject<(() => void) | null>;
}

interface SceneObject {
  id: string;
  type: 'model' | 'primitive' | 'light';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  modelUrl?: string;
  primitiveType?: 'box' | 'sphere' | 'plane';
  lightType?: 'directional' | 'point' | 'spot';
  color?: string;
  intensity?: number;
}

// Scene Object Component
function SceneObjectComponent({
  object,
  isSelected,
  onSelect
}: {
  object: SceneObject;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.Light>(null);

  if (object.type === 'model' && object.modelUrl) {
    const { scene } = useGLTF(object.modelUrl);
    return (
      <group
        ref={meshRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <primitive object={scene.clone()} />
        {isSelected && (
          <mesh>
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshBasicMaterial color="orange" wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  if (object.type === 'primitive') {
    let geometry;
    switch (object.primitiveType) {
      case 'box':
        geometry = <boxGeometry args={[1, 1, 1]} />;
        break;
      case 'sphere':
        geometry = <sphereGeometry args={[0.5, 32, 32]} />;
        break;
      case 'plane':
        geometry = <planeGeometry args={[1, 1]} />;
        break;
      default:
        geometry = <boxGeometry args={[1, 1, 1]} />;
    }

    return (
      <mesh
        ref={meshRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {geometry}
        <meshStandardMaterial color={object.color || '#ffffff'} />
        {isSelected && (
          <mesh>
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshBasicMaterial color="orange" wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </mesh>
    );
  }

  if (object.type === 'light') {
    let lightComponent;
    switch (object.lightType) {
      case 'directional':
        lightComponent = (
          <directionalLight
            ref={lightRef}
            position={object.position}
            intensity={object.intensity || 1}
            color={object.color || '#ffffff'}
          />
        );
        break;
      case 'point':
        lightComponent = (
          <pointLight
            ref={lightRef}
            position={object.position}
            intensity={object.intensity || 1}
            color={object.color || '#ffffff'}
          />
        );
        break;
      case 'spot':
        lightComponent = (
          <spotLight
            ref={lightRef}
            position={object.position}
            intensity={object.intensity || 1}
            color={object.color || '#ffffff'}
            angle={Math.PI / 6}
            penumbra={0.1}
          />
        );
        break;
      default:
        lightComponent = (
          <directionalLight
            ref={lightRef}
            position={object.position}
            intensity={object.intensity || 1}
            color={object.color || '#ffffff'}
          />
        );
    }

    return (
      <group
        position={object.position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {lightComponent}
        {/* Light indicator */}
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={object.color || '#ffff00'} />
        </mesh>
        {isSelected && (
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="orange" wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </group>
    );
  }

  return null;
}

// Transform Controls Component
function TransformController({
  selectedObject,
  mode,
  onTransform
}: {
  selectedObject: SceneObject | null;
  mode: 'translate' | 'rotate' | 'scale';
  onTransform: (object: SceneObject) => void;
}) {
  const { scene } = useThree();

  if (!selectedObject) return null;

  const object3D = scene.getObjectByName(`object-${selectedObject.id}`);
  if (!object3D) return null;

  return (
    <TransformControls
      object={object3D}
      mode={mode}
      onObjectChange={(e) => {
        const updatedObject = {
          ...selectedObject,
          position: [object3D.position.x, object3D.position.y, object3D.position.z] as [number, number, number],
          rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z] as [number, number, number],
          scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z] as [number, number, number]
        };
        onTransform(updatedObject);
      }}
    />
  );
}

export function SceneEditor({ initialModelUrl, onSave, onSaveRef }: SceneEditorProps) {
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<SceneObject | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showGrid, setShowGrid] = useState(true);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  // Initialize with model if provided
  useEffect(() => {
    if (initialModelUrl) {
      const initialObject: SceneObject = {
        id: 'initial-model',
        type: 'model',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        modelUrl: initialModelUrl
      };
      setObjects([initialObject]);
    }
  }, [initialModelUrl]);

  // Check WebGL support
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setWebglSupported(!!gl);
      } catch (e) {
        setWebglSupported(false);
      }
    };

    checkWebGL();
  }, []);

  // Expose save function via ref
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = handleSave;
    }
  }, [onSave]);

  const addPrimitive = useCallback((type: 'box' | 'sphere' | 'plane') => {
    const newObject: SceneObject = {
      id: `primitive-${Date.now()}`,
      type: 'primitive',
      primitiveType: type,
      position: [Math.random() * 4 - 2, Math.random() * 2, Math.random() * 4 - 2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ffffff'
    };
    setObjects(prev => [...prev, newObject]);
    setSelectedObject(newObject);
  }, []);

  const addLight = useCallback((type: 'directional' | 'point' | 'spot') => {
    const newObject: SceneObject = {
      id: `light-${Date.now()}`,
      type: 'light',
      lightType: type,
      position: [Math.random() * 6 - 3, 3, Math.random() * 6 - 3],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ffffff',
      intensity: 1
    };
    setObjects(prev => [...prev, newObject]);
    setSelectedObject(newObject);
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedObject) {
      setObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
      setSelectedObject(null);
    }
  }, [selectedObject]);

  const handleTransform = useCallback((updatedObject: SceneObject) => {
    setObjects(prev => prev.map(obj =>
      obj.id === updatedObject.id ? updatedObject : obj
    ));
  }, []);

  const handleSave = useCallback(() => {
    const sceneData = {
      objects,
      backgroundColor,
      showGrid,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    if (onSave) {
      onSave(sceneData);
    } else {
      // Download as JSON file
      const dataStr = JSON.stringify(sceneData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'scene.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  }, [objects, backgroundColor, showGrid, onSave]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          {/* Transform Tools */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTransformMode('translate')}
              className={`p-2 rounded ${transformMode === 'translate' ? 'bg-purple-600' : 'hover:bg-gray-600'}`}
              title="Move"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransformMode('rotate')}
              className={`p-2 rounded ${transformMode === 'rotate' ? 'bg-purple-600' : 'hover:bg-gray-600'}`}
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransformMode('scale')}
              className={`p-2 rounded ${transformMode === 'scale' ? 'bg-purple-600' : 'hover:bg-gray-600'}`}
              title="Scale"
            >
              <Scale className="w-4 h-4" />
            </button>
          </div>

          {/* Add Objects */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => addPrimitive('box')}
              className="p-2 rounded hover:bg-gray-600"
              title="Add Box"
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              onClick={() => addPrimitive('sphere')}
              className="p-2 rounded hover:bg-gray-600"
              title="Add Sphere"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => addPrimitive('plane')}
              className="p-2 rounded hover:bg-gray-600"
              title="Add Plane"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => addLight('directional')}
              className="p-2 rounded hover:bg-gray-600"
              title="Add Light"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={deleteSelected}
            disabled={!selectedObject}
            className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded"
            title="Delete Selected"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          <Save className="w-4 h-4" />
          <span>Save Scene</span>
        </button>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1">
        {webglSupported === false ? (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">WebGL Not Supported</h3>
              <p className="text-gray-600 mb-4">
                Your browser doesn't support WebGL, which is required for 3D scene editing.
              </p>
              <p className="text-sm text-gray-500">
                Try updating your browser or enabling hardware acceleration in your browser settings.
              </p>
            </div>
          </div>
        ) : webglSupported === null ? (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking WebGL support...</p>
            </div>
          </div>
        ) : (
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance'
            }}
            dpr={[1, 2]}
            onPointerMissed={() => setSelectedObject(null)}
          >
            {/* Background */}
            <color attach="background" args={[backgroundColor]} />

            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />

            {/* Grid */}
            {showGrid && (
              <gridHelper args={[20, 20, '#444444', '#333333']} />
            )}

            {/* Scene Objects */}
            {objects.map((object) => (
              <SceneObjectComponent
                key={object.id}
                object={object}
                isSelected={selectedObject?.id === object.id}
                onSelect={() => setSelectedObject(object)}
              />
            ))}

          {/* Transform Controls */}
          <TransformController
            selectedObject={selectedObject}
            mode={transformMode}
            onTransform={handleTransform}
          />

          {/* Camera Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={50}
          />
        </Canvas>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-sm text-gray-300">
        <div>
          Objects: {objects.length} | Selected: {selectedObject?.id || 'None'}
        </div>
        <div>
          Mode: {transformMode}
        </div>
      </div>
    </div>
  );
}