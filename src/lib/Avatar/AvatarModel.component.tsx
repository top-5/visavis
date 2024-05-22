import React, { FC, Ref, useEffect, useState, useCallback, useMemo } from 'react';
import { Bone, Group, Material, Mesh, MeshStandardMaterial, SkinnedMesh, Vector3, TextureLoader } from 'three';
import { normaliseMaterialsConfig, triggerCallback, usePersistantRotation } from './AvatarModels.service';
import { useFrame, useGraph, useThree } from '@react-three/fiber';
import { hasWindow } from 'src/services/Client.service';
import { BaseModelProps } from 'src/types';
import { SceneEventEmitter, SceneEvents, useSceneEventEmitter } from 'src/lib/UI/SceneEvents';
import { MeshWobbleMaterial, Outlines, shaderMaterial } from '@react-three/drei';
import { hairMaterial } from 'src/lib/Avatar/HairStrandShader';
// import { BlendMode } from 'postprocessing';
// import { BlendingEquation } from 'three';
import * as THREE from 'three';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';

const textureLoader = new TextureLoader();

interface ModelProps extends BaseModelProps {
  scene: Group;
  modelRef?: Ref<Group>;
  scale?: number;
  onSpawnAnimationFinish?: () => void;
  isTouchAllowed?: boolean;
}

const ROTATION_STEP = 0.005;

export const AvatarModel: FC<ModelProps> = ({
  scene,
  scale = 1,
  modelRef,
  onLoaded,
  onSpawnAnimationFinish,
  bloom,
  isTouchAllowed = false
}) => {
  const { materials } = useGraph(scene);
  const { gl } = useThree();
  const [isTouching, setIsTouching] = useState(false);
  const [touchEvent, setTouchEvent] = useState<TouchEvent | null>(null);
  const rigidBodyRef = React.useRef<RapierRigidBody>(null);

  // TODO: refactor wobbling hair into a separate component
  const [wobbleSpeed, setWobbleSpeed] = useState(0.4);
  let lastHipsPosition = new Vector3(0, 0, 0);
  const wobbleMaterial = React.useRef(null);

  const setTouchingOn = (e: MouseEvent | TouchEvent) => {
    if (hasWindow && window.TouchEvent && e instanceof TouchEvent) {
      setTouchEvent(e as TouchEvent);
    }
    setIsTouching(true);
  };
  const setTouchingOff = (e: MouseEvent | TouchEvent) => {
    if (hasWindow && window.TouchEvent && e instanceof TouchEvent) {
      setTouchEvent(null);
    }
    setIsTouching(false);
  };

  usePersistantRotation(scene);

  const onTouchMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isTouchAllowed) {
        return;
      }
      if (isTouching && event instanceof MouseEvent) {
        /* eslint-disable-next-line no-param-reassign */
        scene.rotation.y += event.movementX * ROTATION_STEP;
      }

      if (hasWindow && isTouching && window.TouchEvent && event instanceof TouchEvent) {
        /* eslint-disable-next-line no-param-reassign */
        const movementX = Math.round(event.touches[0].pageX - touchEvent!.touches[0].pageX);
        /* eslint-disable-next-line no-param-reassign */
        scene.rotation.y += movementX * ROTATION_STEP;
        setTouchEvent(event);
      }
    },
    [isTouchAllowed, isTouching, touchEvent, scene]
  );

  useEffect(() => {
    // Ensure the materials and objects are available
    if (!wobbleMaterial.current || !scene) return;

    const wobble = wobbleMaterial.current as MeshStandardMaterial;
    const hair = scene.getObjectByName('Wolf3D_Hair') as SkinnedMesh;
    if (!hair || !(hair.material instanceof MeshStandardMaterial)) {
      console.error('Hair material is not MeshStandardMaterial or hair object not found');
      return;
    }

    const hairMat = hair.material as MeshStandardMaterial;
    const highlightTexture = textureLoader.load('/textures/hair-glow.png');
    wobble.map = highlightTexture; // hairMat.map;
    wobble.blendColor = new THREE.Color(0.5, 0.5, 0.5);
    wobble.emissive.copy(hairMat.emissive);
    wobble.emissiveIntensity = hairMat.emissiveIntensity;
    wobble.emissiveMap = hairMat.emissiveMap;
    wobble.roughness = 255;
    wobble.metalness = 1;
    wobble.normalMap = hairMat.normalMap;
    wobble.normalScale.copy(hairMat.normalScale);
    wobble.aoMap = hairMat.aoMap;
    wobble.aoMapIntensity = hairMat.aoMapIntensity;
    wobble.alphaMap = hairMat.alphaMap;
    wobble.transparent = hairMat.transparent;
    wobble.opacity = hairMat.opacity;
    wobble.side = hairMat.side;
    wobble.opacity = hairMat.opacity;
    wobble.envMap = hairMat.envMap;
    wobble.blendEquation = hairMat.blendEquation;
    wobble.blendSrc = hairMat.blendSrc;
    wobble.blendDst = hairMat.blendDst;
    wobble.blending = hairMat.blending;
    wobble.depthTest = hairMat.depthTest;
    wobble.depthWrite = hairMat.depthWrite;
    wobble.colorWrite = hairMat.colorWrite;
    wobble.premultipliedAlpha = hairMat.premultipliedAlpha;
    wobble.flatShading = hairMat.flatShading;
    wobble.vertexColors = hairMat.vertexColors;
    wobble.forceSinglePass = true;
    hair.material = wobble; // materials;
    wobble.needsUpdate = true;
  }, [scene, wobbleMaterial]);

  useFrame(() => {
    const hips = scene.getObjectByName('Hips') as Bone;
    if (!hips || !wobbleMaterial.current) return;
    // eslint-disable-next-line @react-three/no-new-in-loop
    let currentHipsPosition = new Vector3();
    // eslint-disable-next-line @react-three/no-clone-in-loop
    currentHipsPosition.copy(hips.position.clone());
    currentHipsPosition.applyMatrix4(hips.matrixWorld);
    let distance = currentHipsPosition.distanceTo(lastHipsPosition);
    // Set the factor based on the distance
    setWobbleSpeed(distance * 2);
    lastHipsPosition.copy(currentHipsPosition);
    lastHipsPosition.applyMatrix4(hips.matrixWorld);
  });

  normaliseMaterialsConfig(materials, bloom);
  scene.traverse((object) => {
    const node = object;

    if ((node as Mesh).isMesh) {
      node.castShadow = true;
    }

    if (node.type === 'SkinnedMesh') {
      node.receiveShadow = true;
    }
  });

  useEffect(() => triggerCallback(onLoaded), [scene, materials, onLoaded]);

  useEffect(() => {
    gl.domElement.addEventListener('mousedown', setTouchingOn);
    gl.domElement.addEventListener('touchstart', setTouchingOn, { passive: true });
    window.addEventListener('mouseup', setTouchingOff);
    gl.domElement.addEventListener('touchend', setTouchingOff);
    gl.domElement.addEventListener('touchcancel', setTouchingOff);

    window.addEventListener('mousemove', onTouchMove);
    gl.domElement.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      gl.domElement.removeEventListener('mousedown', setTouchingOn);
      gl.domElement.removeEventListener('touchstart', setTouchingOn);
      window.removeEventListener('mouseup', setTouchingOff);
      gl.domElement.removeEventListener('touchend', setTouchingOff);
      gl.domElement.removeEventListener('touchcancel', setTouchingOff);

      window.removeEventListener('mousemove', onTouchMove);
      gl.domElement.removeEventListener('touchmove', onTouchMove);
    };
  });

  // Notify listeners that the model group has been created
  useSceneEventEmitter(modelRef);

  useEffect(() => {
    SceneEventEmitter.emit(SceneEvents.RigidBodyCreated, rigidBodyRef);
    return () => {
      SceneEventEmitter.emit(SceneEvents.RigidBodyDeleted, rigidBodyRef);
    };
  }, [rigidBodyRef]);

  function dispose() {
    console.warn('Dispose called: ', modelRef);
  }

  return (
    <>
      <primitive
        name="model"
        object={scene}
        scale={scale}
        ref={modelRef}
        dispose={dispose}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
      <MeshWobbleMaterial ref={wobbleMaterial} factor={0.05} speed={wobbleSpeed} />
    </>
  );
};
