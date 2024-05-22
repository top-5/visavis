import React, { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { Physics, RapierRigidBody, RigidBody, useRapier } from '@react-three/rapier';
import * as Rapier from '@dimforge/rapier3d-compat';

import { Sphere, DragControls, Box, Trail, Plane, Environment, Stage } from '@react-three/drei';
import { Podium } from 'src/lib/Scene/Podium';
import { Ground } from 'src/lib/Scene/Ground';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const MainStage: React.FC<Record<string, any>> = ({ environment = 'dawn' }) => {
  const sphere1 = useRef<RapierRigidBody>(null);
  const box1 = useRef<RapierRigidBody>(null);
  const sphere2 = useRef<RapierRigidBody>(null);

  const { scene } = useThree();
  const { world } = useRapier();

  useMemo(() => {
    async function loadAndExecute() {
      const moduleUrl = `${process.env.PUBLIC_URL}/ext/dist/ext.esm.js`;
      const module = await import(/* webpackIgnore: true */ moduleUrl); // Dynamic import
      const dynamicObject = new module.DynamicObject(THREE, Rapier);
      dynamicObject.addObjectToScene(scene, world);
    }
    loadAndExecute();
  }, [scene, world]);

  const ReflectiveMaterial: React.FC<any> = (props) => {
    const { scene } = useThree();

    // Ensure the environment map is updated dynamically
    const envMap = scene.environment;

    return (
      <meshPhysicalMaterial
        color={'white'}
        metalness={0.9} // high metalness for stronger reflections
        roughness={0.1} // lower roughness for sharper reflections
        transparent={true}
        opacity={0.1}
        envMap={envMap}
        envMapIntensity={1} // Adjust for stronger or weaker reflections
        clearcoat={1} // Adding clearcoat for extra glossy finish
        clearcoatRoughness={0} // Clearcoat roughness at minimum for gloss
        {...props} // allows for overriding or extending the default props
      />
    );
  };

  function jump(ref: React.RefObject<RapierRigidBody>) {
    let rigidBody = ref.current;
    if (rigidBody) {
      let mass = rigidBody.mass();
      console.log('Jumping rigid body: ', rigidBody, 'Mass: ', mass);
      let height = 5;
      let impulse = mass * Math.sqrt(2 * 9.81 * height);
      rigidBody.applyImpulse(new Vector3(0, impulse, 0), true);
    }
  }

  return (
    <>
      <Stage adjustCamera intensity={0.5} shadows="contact" />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Podium />
      <Ground />

      {/* Objects */}
      <RigidBody ref={sphere1} position={[2, 10, 2]} restitution={0.2}>
        <Sphere args={[0.3]} onDoubleClick={() => jump(sphere1)} />
      </RigidBody>

      <RigidBody ref={box1} position={[-5, 10, -5]} restitution={0.2}>
        <Box onDoubleClick={() => jump(box1)} />
      </RigidBody>

      <RigidBody ref={sphere2} position={[0, 10, 0]} restitution={0.2}>
        <Sphere args={[0.3]} onDoubleClick={() => jump(sphere2)} />
      </RigidBody>

      {/* Warehouse walls */}
      <RigidBody type="fixed">
        <Box args={[64, 32, 0.1]} position={[0, 5, -16]}>
          <ReflectiveMaterial />
        </Box>
        {/* Back wall */}
        <Box args={[64, 32, 0.1]} position={[0, 5, 16]}>
          <ReflectiveMaterial />
        </Box>
        {/* Left wall */}
        <Box args={[0.1, 32, 64]} position={[-16, 5, 0]}>
          <ReflectiveMaterial />
        </Box>
        {/* Right wall */}
        <Box args={[0.1, 32, 64]} position={[16, 5, 0]}>
          <ReflectiveMaterial />
        </Box>
      </RigidBody>
    </>
  );
};
