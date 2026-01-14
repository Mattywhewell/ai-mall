import React from 'react';

export function SpatialEnvironment() {
  return (
    <>
      {/* Sky and Environment components disabled - may be causing Polygon issues */}
      {/* <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />
      <Environment preset="sunset" /> */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <fog attach="fog" args={["#e6f3ff", 20, 100]} />
    </>
  );
}
