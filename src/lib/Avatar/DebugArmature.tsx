import { useFrame, useThree } from '@react-three/fiber';
import { FC, RefObject, useCallback } from 'react';
import { Object3D, Mesh, SkinnedMesh, MeshStandardMaterial, Group, Box3 } from 'three';
import React from 'react';
import { AnimationControl, useAnimationControl } from 'src/lib/Animation/AnimationContext';
import { MeshCollider, RigidBody } from '@react-three/rapier';
import { cleanupThreeObject } from '../utils';

/**
 * Properties for the DebugArmature component.
 */
export interface DebugArmatureProps {
  alpha?: number;
  jointColor?: number;
  boneColor?: number;
  timeScale?: number;
  visible?: boolean;
  armatureRef: RefObject<Object3D>;
  enableBoneHelper?: boolean;
}

/**
 * Component that displays the armature of an object with bones. A copy of the armature is created and displayed.
 *
 * @param param0
 * @returns
 */
export const DebugArmature: FC<DebugArmatureProps> = ({
  armatureRef,
  alpha = 0.6,
  jointColor = 0xff0000,
  boneColor = 0x00ff00,
  timeScale = 1.0,
  visible = false,
  enableBoneHelper = false
}) => {
  const animationControl: AnimationControl = useAnimationControl(); // useContext(AnimationControlContext);
  let cycleAlpha: number = 0.0;
  const { scene } = useThree();

  /**
   * Align Debug armature with the original armature in the scene.
   *
   * @returns
   */
  const alignArmature = useCallback(() => {
    let armature = armatureRef.current;
    let debugArmature = animationControl.debugArmature;
    if (armature && debugArmature) {
      let position = armature.position.clone();
      let quaternion = armature.quaternion.clone();
      let scale = armature.scale.clone();
      armature.getWorldPosition(position);
      armature.getWorldQuaternion(quaternion);
      armature.getWorldScale(scale);

      debugArmature.position.copy(position);
      debugArmature.quaternion.copy(quaternion);
      debugArmature.scale.copy(scale);
      debugArmature.updateMatrixWorld();
    }
  }, [armatureRef, animationControl.debugArmature]);

  /**
   * Create a cloned armature for debug visualizations.
   *
   * @returns
   */
  const getDebugArmature = useCallback(() => {
    if (!animationControl) {
      console.error('Animation control is not set!');
      return null;
    }
    let armature = armatureRef.current;
    if (!armature) {
      console.error('Armature is not set!');
      return null;
    }
    let debugArmature = animationControl.debugArmature;
    if (debugArmature) {
      return debugArmature;
    }

    const Armature_Debug = armature.clone(false) as Group;
    Armature_Debug.name = 'Armature_Debug';
    animationControl.debugArmature = Armature_Debug;
    armature.traverse((object) => {
      if (object.name.includes('_helper_')) return;
      if (object instanceof Mesh || object instanceof SkinnedMesh) {
        let obj = object.clone(false) as Mesh;
        if (object instanceof SkinnedMesh) {
          obj.material = new MeshStandardMaterial({ color: 0x00ff00, wireframe: true, wireframeLinewidth: 0.1 });
        } else {
          obj.material = new MeshStandardMaterial({ color: 0x00cc00, wireframe: true, wireframeLinewidth: 2 });
        }
        let parent_name = object.parent!.name;
        if (parent_name === 'Armature') {
          Armature_Debug.add(obj);
        } else {
          let parent = Armature_Debug.getObjectByName(parent_name);
          if (parent) {
            parent.add(obj);
          }
        }
      }
    });
    scene.add(Armature_Debug);
    alignArmature();
    return debugArmature;
  }, [animationControl, armatureRef, alignArmature]);

  function updateAlpha(object: Object3D, alpha: number) {
    if (!object) {
      return;
    }
    object.traverse((child) => {
      if (child instanceof Mesh || child instanceof SkinnedMesh) {
        let mesh = child as Mesh;
        let material = mesh.material as MeshStandardMaterial;
        if (material) {
          material.transparent = true;
          material.opacity = alpha;
        }
      }
    });
  }

  useFrame((state, delta, frame) => {
    // Get time in ms from perf counter
    let time = performance.now();
    getDebugArmature();
    const K = (Math.PI * 2) / 1000;
    let debugArmature = animationControl.debugArmature;
    if (debugArmature) {
      cycleAlpha = alpha + (alpha / 2) * Math.sin((time * K) / 2);
      if (!visible) {
        cycleAlpha = 0;
      }
      updateAlpha(debugArmature, cycleAlpha);
      alignArmature();
    }
  });

  return null;
};
