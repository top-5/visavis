import { Grid } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import React from 'react';

export const Ground: React.FC = () => {

  const gridConfig = {
    cellSize: 0.5,
    cellThickness: 0.5,
    cellColor: '#6f6f6f',
    sectionSize: 3,
    sectionThickness: 1,
    sectionColor: '#9d4b4b',
    fadeDistance: 30,
    fadeStrength: 1,
    followCamera: false,
    infiniteGrid: true
  };

  return (
    <>
      <RigidBody type="fixed">
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeBufferGeometry args={[2000, 2000]} />
          <meshStandardMaterial
            color="black"
            transparent={true}
            opacity={0.5}
            colorWrite={false}
            depthWrite={false}
            visible={false}
          />
        </mesh>
      </RigidBody>
      <Grid position={[0, -0.01, 0]} args={[10.5, 10.5]} {...gridConfig} />
    </>
  );
};