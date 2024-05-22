/* eslint-disable no-useless-computed-key */
import { useControls, useStoreContext, useCreateStore, LevaPanel, LevaStoreProvider, Leva, folder, button } from 'leva';
import { AnimationControl, AnimationControlContext } from 'src/lib/Animation/AnimationContext';
import * as Emotions from 'src/lib/Avatar/Emotions';
import React, { useContext } from 'react';
import * as THREE from 'three';
// import { useGraph, useThree } from '@react-three/fiber';
// import { SceneEventEmitter } from 'src/lib/UI/SceneEvents';

export type RunAnimationCallback = () => void;

interface AvatarControlsProps {
  runAnimation?: RunAnimationCallback;
  stopAnimation?: RunAnimationCallback;
  animationSources: string[];
}

export const useAvatarControls = (props: AvatarControlsProps, deps: any) => {
  const animationControl: AnimationControl = useContext(AnimationControlContext);
  animationControl.updateAvatarControls = updateAvatarControls;
  
  const sceneControls: any = {
    ['shadows']: {
      value: true,
      label: 'Shadows',
      min: 0,
      max: 1,
      step: 1
    },
    ['environment']: {
      value: '',
      label: 'Environment',
      options: ['', 'warehouse', 'city', 'sunset', 'dawn', 'night', 'forest', 'park', 'lobby', 'spaceStation']
    }
  };

  const debugParametersControls = {
    ['Debug Armature']: folder(
      {
        ['showHelper']: {
          value: false,
          label: 'Show Helper',
          min: 0,
          max: 1
        },
        ['helperAlpha']: {
          value: 0,
          label: 'Helper Alpha',
          min: 0,
          max: 100,
          step: 1
        },
        ['debugAlpha']: {
          value: 0,
          label: 'Debug Alpha',
          min: 0,
          max: 100,
          step: 1
        },
        ['physicsAlpha']: {
          value: 0,
          label: 'Physics Alpha',
          min: 0,
          max: 100,
          step: 1
        }
      },
      { collapsed: true }
    )
  };

  const emotionControls = {
    ['activeViseme']: {
      value: '',
      label: 'Active Viseme',
      options: Emotions.VisemeNames
    },
    ['activeEmotion']: {
      value: '',
      label: 'Active Emotion',
      options: Object.keys(Emotions.EmotionKind).filter((key) => Number.isNaN(Number(key)))
    }
  };

  const hips = animationControl.armature?.getObjectByName('Hips') as THREE.Bone;

  const avatarControls = {
    ['actionName']: {
      value: '/animations/F_Standing_Idle_001.fbx',
      label: 'Animation Source',
      options: [...new Set(props.animationSources)].sort()  
    },
    ['armaturePosition']: {
      value: animationControl.armature?.position
        ? {
            x: animationControl.armature.position.x,
            y: animationControl.armature.position.y,
            z: animationControl.armature.position.z
          }
        : { x: 0, y: 0, z: 0 },
      label: 'Armature Position',
      onChange: (value: THREE.Vector3) => {
        animationControl.armature?.position.set(value.x, value.y, value.z);
        animationControl.armature?.updateMatrixWorld(true);
      }
    },
    ['hipsPosition']: {
      value: hips?.position ? { x: hips.position.x, y: hips.position.y, z: hips.position.z } : { x: 0, y: 1, z: 0 },
      label: 'Hips Position',
      onChange: (value: THREE.Vector3) => {
        if (hips) {
          hips.position.set(value.x, value.y, value.z);
          hips.updateMatrixWorld(true);
        }
      }
    }
  };

  return useControls(
    { ...sceneControls, ...debugParametersControls, ...emotionControls, ...avatarControls /*, ...props */ },
    { collapsed: true },
    [deps]
  );
};

export interface AvatarControlsElements {
  apx: HTMLInputElement;
  apy: HTMLInputElement;
  apz: HTMLInputElement;
  hpx: HTMLInputElement;
  hpy: HTMLInputElement;
  hpz: HTMLInputElement;
}

export function getAvatarControlsElements(): AvatarControlsElements {
  let apx = document.getElementById('armaturePosition') as HTMLInputElement;
  let apy = document.getElementById('armaturePosition.y') as HTMLInputElement;
  let apz = document.getElementById('armaturePosition.z') as HTMLInputElement;
  let hpx = document.getElementById('hipsPosition') as HTMLInputElement;
  let hpy = document.getElementById('hipsPosition.y') as HTMLInputElement;
  let hpz = document.getElementById('hipsPosition.z') as HTMLInputElement;
  return { apx, apy, apz, hpx, hpy, hpz };
}

let ac: AvatarControlsElements | null = null;

/**
 * Updates the avatar controls. This method is called when either armaure or hips are updated.
 *
 * @param animationControl
 */
export const updateAvatarControls = (animationControl: AnimationControl) => {
  if (!ac) {
    // Obtain once and cache, so that we don't slow down the rendering loop.
    ac = getAvatarControlsElements();
  }

  if (ac.apx && ac.apy && ac.apz) {
    const armature = animationControl.armature;
    if (armature) {
      const avatarWorldPosition = new THREE.Vector3();
      armature.getWorldPosition(avatarWorldPosition);
      ac.apx.value = avatarWorldPosition.x.toString();
      ac.apy.value = avatarWorldPosition.y.toString();
      ac.apz.value = avatarWorldPosition.z.toString();
    }
  }
  if (ac.hpx && ac.hpy && ac.hpz) {
    const hips = animationControl.armature?.getObjectByName('Hips') as THREE.Bone;
    if (hips) {
      ac.hpx.value = hips.position.x.toString();
      ac.hpy.value = hips.position.y.toString();
      ac.hpz.value = hips.position.z.toString();
    }
  }
};
