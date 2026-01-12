// React Three Fiber JSX elements and hooks
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // React Three Fiber elements
      mesh: any;
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshDistortMaterial: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      shaderMaterial: any;
      pointsMaterial: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      group: any;
      stars: any;
      color: any;
    }
  }

  // React Three Fiber hooks
  function useThree(): any;
  function useFrame(callback: (state: any) => void): void;
  const Html: any;
  const OrbitControls: any;
  const Float: any;
  const Text: any;
  const Stars: any;
  const Sphere: any;
  const MeshDistortMaterial: any;
  const THREE: any;
}