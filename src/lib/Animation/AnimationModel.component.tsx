import React, { useRef, FC, useMemo, useContext } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { AnimationMixer, Group, MeshStandardMaterial, Object3D, SkinnedMesh, Vector3 } from 'three';

import { AvatarModel } from 'src/lib/Avatar/AvatarModel.component';
import { useHeadMovement, useGltfLoader, useFallback, useIdleExpression } from 'src/lib/Avatar/AvatarModels.service';
import { BaseModelProps } from 'src/types';
import { Emotion } from 'src/lib/types';
import { AnimationControl, AnimationControlContext } from './AnimationContext';
import { cleanupThreeObject, findLowestPoint } from 'src/lib/utils';
// import { useGLTF } from '@react-three/drei';

export interface AnimationModelProps extends BaseModelProps {
  modelSrc: string | Blob;
  actionName?: string;
  animationSrc: string | Blob;
  rotation?: number;
  scale?: number;
  idleRotation?: boolean;
  headMovement?: boolean;
  emotion?: Emotion;
}

let currentRotation = 0;

function enhanceSkinMeshes(object: Object3D) {
  object.traverse((child: Object3D) => {
      if (child instanceof SkinnedMesh) {
          const skin: SkinnedMesh = child as SkinnedMesh;
          if (skin.material instanceof Array) {
              skin.material.forEach((material) => {
                  console.log('Material: ', material);
              });
          } else {
            const material = skin.material as MeshStandardMaterial;
            console.log('Material: ', material);
          }
      }
  });
}


export const AnimationModel: FC<AnimationModelProps> = ({
  modelSrc,
  actionName = '',
  animationSrc = '',
  rotation = 20 * (Math.PI / 180),
  scale = 1,
  idleRotation = false,
  setModelFallback,
  headMovement = false,
  emotion,
  bloom,
  ...props
}) => {
  console.log('Rendering AnimationModel');
  const animationControl: AnimationControl = useContext(AnimationControlContext);
  const modelRef = useRef<Group>(null);

  const { scene } = useGltfLoader(modelSrc);
  enhanceSkinMeshes(scene);
  const { nodes } = useGraph(scene);
  console.log('Nodes: ', nodes);

  /**
   * This function updates the model offset to make sure the model is standing on the ground.
   */
  function updateModelOffset() {
    const hips = nodes.Hips;
    let dy = findLowestPoint(scene);
    console.log('updateModelOffset: lowest=', dy);
    if (dy < 0) {
      hips.position.y = -dy;
      hips.matrixWorldNeedsUpdate = true;
    }
  }

  if (animationSrc) {
    animationControl.loadAnimationAction(actionName, animationSrc).then(() => {
      if (nodes.Armature) {
        updateModelOffset();
        animationControl.play();
      }
    });
  }

  useMemo(() => {
    console.log('Creating new animation mixer for armature: ', nodes.Armature);
    if (!animationControl.armature) {
      animationControl.stop();
      if (animationControl.armature && animationControl.armature !== nodes.Armature) {
        console.warn('Cleaning up old armature: ', animationControl.armature);
        cleanupThreeObject(nodes.Armature);
        if (animationControl.debugArmature) {
          console.warn('Cleaning up old debug armature: ', animationControl.debugArmature);
          cleanupThreeObject(animationControl.debugArmature);
          animationControl.debugArmature = null;
        }
      }
      animationControl.armature = nodes.Armature;
      animationControl.mixer = new AnimationMixer(nodes.Armature);
    }
  }, [nodes.Armature]);

  useFrame(async (state, delta) => {
    animationControl.updateMixer(delta);
    if (!idleRotation) {
      return;
    }
    if (modelRef?.current) {
      currentRotation += delta * 0.2;
      modelRef.current.rotation.y = rotation + Math.sin(currentRotation) / 3;
    }
  });

  useHeadMovement({ nodes, enabled: headMovement });
  // useEmotion(nodes, emotion);
  useIdleExpression('blink', nodes);
  useFallback(nodes, setModelFallback);

  function onLoaded() {
    console.log('Model loaded.', modelRef.current);
    updateModelOffset();
  }

  return <AvatarModel modelRef={modelRef} scene={scene} scale={scale} onLoaded={onLoaded} bloom={bloom} />;
};
