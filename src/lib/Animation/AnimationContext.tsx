import React, { Key, createContext, useContext, useRef } from 'react';
import { ObjectMap, useFrame, useThree } from '@react-three/fiber';
import { AnimationClip, AnimationMixer, Group } from 'three';
import * as THREE from 'three';

// TODO: change this so that the import is from external library
import { loadAnimationClip, translateAnimationsToOrigin, rotate360 } from 'src/lib/Avatar/AvatarAnimation.service';
import { SceneEventEmitter, SceneEvents } from 'src/lib/UI/SceneEvents';
import { alignToCenter, closedLoop, smoothTransform } from './AnimationPaths';
import { applyViseme } from 'src/lib/Avatar/Emotions';
import { decode } from 'querystring';
import { CameraController } from 'src/lib/UI/CameraController';
import { AvatarController } from 'src/lib/Avatar/AvatarController';

type Emotion = Record<string, number>;

/**
 * This interface allows to control the animation of the model.
 */
interface AnimationControl {
  emotion: Emotion;
  viseme: string;

  get continuum(): boolean;
  set continuum(value: boolean);

  // Extract next line type into callback
  updateAvatarControls?: (animationControl: AnimationControl) => void;

  play: () => void;
  playNext: (time: number) => void;
  get playing(): boolean;

  pause: () => void;
  get paused(): boolean;

  stop: () => void;

  // Rewind to the beginning of the animation
  start: () => void;

  // Step the animation by delta time
  step: (delta: number) => void;

  // Step the animation to the end
  end: () => void;

  // Avatar controller allows to control the avatar model within the scene.
  set avatarController(controller: AvatarController);
  get avatarController(): AvatarController | null;

  // Camera controller allows to control the camera within the scene.
  set cameraController(controller: CameraController);
  get cameraController(): CameraController | null;

  // Armature is the main player
  get armature(): THREE.Object3D | null;
  set armature(armature: THREE.Object3D);

  // Debug armature is an extra mesh shown in the scene for debugging purposes.
  // Debug armature may be used to show the target of the next animation.
  get debugArmature(): THREE.Object3D | null;
  set debugArmature(armature: THREE.Object3D | null);

  // Mixer is the main player AnimationMixer
  set mixer(mixer: AnimationMixer | React.RefObject<AnimationMixer>);
  get mixer(): AnimationMixer | null;

  // Debug mixer is an extra mixer that allows to independently animate the debug armature.
  set debugMixer(mixer: AnimationMixer);
  get debugMixer(): AnimationMixer | null;

  // Update current AnimationMixer with delta time
  updateMixer: (delta: number) => void;

  set timeScale(timeScale: number);
  get timeScale(): number;

  loadAnimationAction: (action: string, animationSrc: string | Blob) => Promise<void | AnimationClip>;
  set action(action: string);

  // Set viseme and emotion
  setViseme: (viseme: string) => void;
  setEmotion: (emotion: Emotion) => void;
  getEmotion: () => Emotion;
}

/**
 * This function checks if the mixer is a React.RefObject<AnimationMixer>.
 *
 * @param mixer
 * @returns
 */
function isRefObject(mixer: any): mixer is React.RefObject<AnimationMixer> {
  return mixer && typeof mixer === 'object' && 'current' in mixer;
}

/**
 * This function gets the world position of the frame in animation at given time.
 *
 * @param animation
 * @returns
 */

function getPositionAtTime(
  animation: THREE.AnimationClip,
  time: number = 0
): { pos: THREE.Vector3; quat: THREE.Quaternion } {
  let pos = new THREE.Vector3();
  let quat = new THREE.Quaternion();
  if (time > animation.duration) {
    time %= animation.duration;
  }
  animation.tracks.forEach((track) => {
    if (track.name.includes('Hips.position')) {
      // Interpolate position keyframe values
      const positionTrack = track as THREE.VectorKeyframeTrack;
      let interpolant = positionTrack.createInterpolant();
      let position = interpolant.evaluate(time) as Float32Array;
      pos.set(position[0], position[1], position[2]);
    }
    if (track.name.includes('Hips.quaternion')) {
      // Interpolate quaternion keyframe values
      const quaternionTrack = track as THREE.QuaternionKeyframeTrack;
      let interpolant = quaternionTrack.createInterpolant();
      let q = interpolant.evaluate(time) as Float32Array;
      quat = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
    }
  });
  // Apply the quaternion to the position to account for rotation
  // pos.applyQuaternion(quat);
  return { pos, quat };
}

// GOOD WORKING CODE:
/*
function getNextPosition(animation: AnimationClip, timeInSec: number = 0): THREE.Vector3 {
    let pos = new THREE.Vector3();
    let quat = new THREE.Quaternion();
    let tracks = animation.tracks!;
    for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i] as THREE.VectorKeyframeTrack;
        if (track.name.includes("Hips.position")) {
            pos.set(track.values[0], track.values[1], track.values[2]);
        }
        if (track.name.includes("Hips.quaternion")) {
            quat.set(track.values[0], track.values[1], track.values[2], track.values[3]);
        }
    }
    return pos.applyQuaternion(quat);
}
*/

/**
 * This function updates the emotion of the model. It iterates over the meshes and sets the morph target influences.
 *
 * @param armature
 * @param emotion
 */
export function updateEmotion(armature: THREE.Object3D /* nodes: ObjectMap['nodes'] */, emotion?: Emotion) {
  // @ts-ignore
  // const meshes = Object.values(nodes).filter((item: SkinnedMesh) => item?.morphTargetInfluences) as SkinnedMesh[];
  // @ts-ignore
  const meshes = armature.children.filter((item: SkinnedMesh) => item?.morphTargetInfluences) as SkinnedMesh[];

  const resetEmotions = (resetMeshes: Array<THREE.SkinnedMesh>) => {
    resetMeshes.forEach((mesh) => {
      mesh?.morphTargetInfluences?.forEach((_, index) => {
        mesh!.morphTargetInfluences![index] = 0;
      });
    });
  };

  if (emotion) {
    resetEmotions(meshes);
    meshes.forEach((mesh) => {
      Object.entries(emotion).forEach(([shape, value]) => {
        const shapeId = mesh?.morphTargetDictionary?.[shape];
        if (shapeId) {
          mesh!.morphTargetInfluences![shapeId] = value;
        }
      });
    });
  } else {
    resetEmotions(meshes);
  }
}

class DefaultAnimationControl implements AnimationControl {
  static instanceCount: number = 0;

  emotion: Emotion = {};
  viseme: string = '';

  _continuum: boolean = true;

  updateAvatarControls?: ((animationControl: AnimationControl) => void) | undefined;
  
  // Camera controller
  _cameraController: CameraController | null = null;

  // Avatar controller
  _avatarController: AvatarController | null = null;

  // Values that generally don't change unless the model changes.
  _mixer: AnimationMixer | null = null;
  _armature: THREE.Object3D | null = null;

  _debugMixer: AnimationMixer | null = null;
  _debugArmature: THREE.Object3D | null = null;

  _actions: Map<string, AnimationClip> = new Map<string, AnimationClip>();
  _timeScale: number = 1;

  // Current animation action
  _action: string = '';
  _animationAction: THREE.AnimationAction | null = null;
  _animationClip: AnimationClip | null = null;

  // Next animation action
  _nextAction: string = '';
  _nextAnimationAction: THREE.AnimationAction | null = null;
  _nextAnimationClip: AnimationClip | null = null;

  _paused: boolean = false;
  _playing: boolean = false;

  constructor() {
    console.log('DefaultAnimationControl constructor', DefaultAnimationControl.instanceCount, this);
    DefaultAnimationControl.instanceCount++;
    this._avatarController = new AvatarController();
  }

  set cameraController(controller: CameraController) {
    this._cameraController = controller;
  }

  get cameraController(): CameraController | null {
    return this._cameraController;
  }

  set avatarController(controller: AvatarController) {
    this._avatarController = controller;
  }

  get avatarController(): AvatarController | null {
    return this._avatarController;
  }

  set armature(armature: THREE.Object3D) {
    this._armature = armature;
  }

  get armature(): THREE.Object3D | null {
    return this._armature;
  }

  get continuum(): boolean {
    return this._continuum;
  }

  set continuum(value: boolean) {
    this._continuum = value;
  }

  get debugArmature(): THREE.Object3D | null {
    return this._debugArmature;
  }

  set debugArmature(armature: THREE.Object3D | null) {
    this._debugArmature = armature;
  }

  get mixer(): AnimationMixer | null {
    return this._mixer;
  }

  set mixer(mixer: AnimationMixer | React.RefObject<AnimationMixer>) {
    this.setMixer(mixer);
  }

  get timeScale(): number {
    return this._timeScale;
  }

  set timeScale(timeScale: number) {
    this._timeScale = timeScale;
  }

  set action(action: string) {
    this.setAction(action);
  }

  setViseme(viseme: string): void {
    console.log('Set viseme: ', viseme);
    this.viseme = viseme;
    applyViseme(this.emotion, viseme);
    this.setEmotion(this.emotion);
  }

  setEmotion(emotion: Emotion): void {
    console.log('Set emotion: ', emotion);
    this.emotion = emotion;
    if (this._armature) {
      updateEmotion(this._armature, emotion);
    }
  }

  getEmotion(): Emotion {
    return this.emotion;
  }

  set debugMixer(mixer: AnimationMixer) {
    this._debugMixer = mixer;
  }

  get debugMixer(): AnimationMixer | null {
    return this._debugMixer;
  }

  playNext(time: number = 0): void {
    if (!this._mixer) {
      console.error('Mixer not set.');
      return;
    }
    if (!this._nextAnimationClip) {
      console.error('Next animation clip not set.');
      return;
    }
    if (!this._nextAnimationAction) {
      console.warn('Next animation action not set, setting it now.');
      this._nextAnimationAction = this._mixer!.clipAction(this._nextAnimationClip);
    }

    // Set current values
    this._action = this._nextAction;
    this._animationClip = this._nextAnimationClip;

    console.log('Start playing animation: ', this._action);
    this._animationAction = this._nextAnimationAction;
    // this.animationAction.setLoop(THREE.LoopPingPong, 99);
    this._animationAction.setLoop(THREE.LoopRepeat, 99);
    this._animationAction.fadeIn(time);
    this._animationAction.time = time;
    this._animationAction.play();
    SceneEventEmitter.emit(SceneEvents.AnimationStarted, { animation: this._animationClip, time: time });

    // Rest next values
    this._nextAnimationAction = null;
    this._nextAction = '';
    this._nextAnimationClip = null;

    this._mixer!.update(0);
  }

  play(): void {
    console.log('AnimationContext::play()');
    if (!this._mixer || !this._armature) {
      window.alert('Mixer or armature not set.');
      console.error('Mixer or armature not set.');
      return;
    }

    // Resume the animation if it was paused.
    this._playing = true;
    if (this._paused === true) {
      this._paused = false;
      this._animationAction!.play();
      SceneEventEmitter.emit(SceneEvents.AnimationStarted, {
        animation: this._animationClip,
        time: this._animationAction?.time
      });
      return;
    }

    const hips = this._armature.children.find((bone) => bone.name.includes('Hips'));
    if (this._nextAnimationClip) {
      this._nextAnimationAction = this._mixer.clipAction(this._nextAnimationClip, hips);
      if (this._animationAction) {
        console.log('Transition from ', this._action, ' to ', this._nextAction);
        this._animationAction.clampWhenFinished = true;
        this._animationAction.setLoop(THREE.LoopOnce, 0);

        let prev = getPositionAtTime(this._animationClip!);
        let prevPos = prev.pos.applyQuaternion(prev.quat);

        let travelDistance = prevPos.distanceTo(hips!.position);

        let next = getPositionAtTime(this._nextAnimationClip);
        let distance = next.pos.distanceTo(hips!.position); // + travelDistance;
        let time = distance * 2;

        // DEBUG - Smooth transition. Emit event to update debug armature to show the next animation target.
        SceneEventEmitter.emit(SceneEvents.AnimationTargetUpdated, { animation: this._nextAnimationClip, time: 0 });

        /*              
                                /// THIS IS A WORKING CODE FOR A RELATIVELY SMOOTH TRANSITION. HOWEVER, I'D LIKE TO TRY THE APPROACH THAT
                                /// ALLOWS TO REDUCE THE AMOUNT OF TRANSITIONS, ESPECIALLY IN CASE WHEN THE NEXT ANIMATION IS FAR AWAY:
                                /// WE'LL USE CLOSED LOOP TRANSITION TO THE NEXT ANIMATION TARGET INSTEAD OF SMOOTH.
                
                                // Non-linear time scaling
                                let intervalId = setInterval(() => {
                                    this.mixer!.timeScale *= 1.5;
                                }, time * 1000 / 8);
                
                                let smoothClip = smoothTransform(this.mixer, hips!, this.animationClip!, this.nextAnimationClip!, time);
                                let smoothAction = this.mixer.clipAction(smoothClip, hips!);
                                smoothAction.setLoop(THREE.LoopOnce, 0);
                                smoothAction.clampWhenFinished = true;
                                smoothAction.crossFadeTo(this.nextAnimationAction, time, true);
                                smoothAction.fadeIn(0);
                                smoothAction.play();
                                this.animationAction.stop();
                                this.animationAction = smoothAction;
                                setTimeout(() => {
                                    clearInterval(intervalId);
                                    this.mixer!.timeScale = this.timeScale;
                                    this.animationAction!.stop();
                                    this.mixer?.stopAllAction();
                                    this.armature!.animations.length = 0;
                                    this.playNext(time);
                                }, time * 1000);
                */
        this._animationAction.stop();
        this._mixer?.stopAllAction();
        this._armature!.animations.length = 0;
        this.playNext(0);
      } else {
        this.playNext(0);
      }
    }
  }

  get paused(): boolean {
    return this._paused;
  }

  get playing(): boolean {
    return this._playing;
  }

  pause(): void {
    console.log('pause');
    if (!this._mixer || !this._animationAction) {
      console.error('Mixer or animation action not set.');
      return;
    }
    this._playing = false;
    this._paused = true;
    SceneEventEmitter.emit(SceneEvents.AnimationPaused, {
      animation: this._animationClip,
      time: this._animationAction?.time
    });
  }

  // Rewind to the beginning of the animation.
  // TODO:
  // - if multiple animations are played, rewind to the beginning of the current animation.
  // - if already at the beginning, rewind to the beginning of the previous animation.
  start(): void {
    if (!this._mixer || !this._animationAction) {
      console.error('Mixer or animation action not set.');
      return;
    }
    this._animationAction.time = 0;
    if (this._paused === true) {
      let time = this._animationAction.time;
      this.updateMixer(-time, true);
      this.updateMixer(0, true);
    } else {
      this._animationAction.play();
    }
  }

  // Step the animation by delta time.
  step(delta: number): void {
    if (!this._mixer || !this._animationAction) {
      console.error('Mixer or animation action not set.');
      return;
    }
    // this._animationAction.time += delta;
    this.updateMixer(delta, true);
  }

  // Step the animation to the end.
  // TODO:
  // - if multiple animations are played, step to the end of the current animation.
  // - if already at the end, step to the end of the next animation.
  end(): void {
    if (!this._mixer || !this._animationAction) {
      console.error('Mixer or animation action not set.');
      return;
    }
    this.start();
    this.step(-0.01);
  }

  stop(): void {
    console.log('stop');
    if (!this._mixer || !this._animationAction) {
      console.error('Mixer or animation action not set.');
      return;
    }
    SceneEventEmitter.emit(SceneEvents.AnimationStopped, {
      animation: this._animationClip,
      time: this._animationAction?.time
    });
    this._animationAction?.stop();
    this._mixer?.stopAllAction();

    // Remember in case if user wants to play again.
    this._nextAction = this._action;
    this._nextAnimationClip = this._animationClip;

    this._action = '';
    this._animationAction = null;
    this._debugMixer?.stopAllAction();
    this._paused = false;
    this._playing = false;
  }

  setMixer(aMixer: AnimationMixer | React.RefObject<AnimationMixer>): void {
    console.log('setMixer: ', aMixer);
    let mixer = (isRefObject(aMixer) ? aMixer.current : aMixer) as AnimationMixer;
    if (!mixer) {
      console.error('Mixer not set.');
      return;
    }

    this._mixer = mixer;
    this._armature = this._mixer.getRoot() as THREE.Object3D;
    this._mixer.timeScale = this._timeScale;
    // Sometimes you need to start with a smile on your face.
    updateEmotion(this._armature, this.emotion);
  }

  getMixer(): AnimationMixer | null {
    // console.log("getMixer: ", this.mixer);
    return this._mixer;
  }

  adjustForContinuity(): void {
    if (!this._armature || !this._animationClip) {
      console.error('Armature or animation clip not set.');
      return;
    }
    // We've reached the end of the animation. Adjust the avatar position to the current position of the hips.
    let hips = this._armature.children.find((bone) => bone.name.includes('Hips'));
    if (hips) {
      let start = getPositionAtTime(this._animationClip, 0);
      let end = getPositionAtTime(this._animationClip, this._animationClip.duration);
      let travelDistance = start.pos.distanceTo(end.pos);
      if (travelDistance > 0.01) {
        // Move the platform to position of the hips at the end of the animation.
        // start.pos.applyQuaternion(start.quat);
        start.pos = this._armature.localToWorld(start.pos);
        // end.pos.applyQuaternion(end.quat);
        end.pos = this._armature.localToWorld(end.pos);
        // Delta vector in world coordinates
        let delta = end.pos.sub(start.pos);
        // Do not move the platform in the vertical direction.
        delta.y = 0;
        // Move platform to the new position.
        let target = this.avatarController?.getTarget();
        target?.position.add(delta);
        target?.updateMatrix();
      }
    }
  }

  updateMixer(delta: number, force: boolean = false): void {
    if (this._paused === true && !force) {
      return;
    }
    this.updateAvatarControls?.(this);

    // Check if we are at the end of the animation
    let overflow = 0;
    if (this.continuum && this._animationAction) {
      let time = this._animationAction.time + delta;
      if (time >= this._animationAction.getClip().duration) {
        overflow = 1;
      }
    }
    if (overflow > 0) {
      this.adjustForContinuity();
    }
    this._mixer?.update(delta);
    this._debugMixer?.update(delta);
  }

  async loadAnimationAction(action: string, animationSrc: string | Blob): Promise<void | AnimationClip> {
    if (!this._armature) {
      console.error('Armature not set.');
      return;
    }

    let actionName = action;
    if (typeof animationSrc === 'string' && actionName === '') {
      // sourcery skip: dont-self-assign-variables
      actionName = decodeURIComponent(animationSrc);
    }
    actionName = actionName.split('/').pop()!.split('.').shift()!;
    console.log('Loading animation action: ', actionName, 'from', animationSrc);
    let clip = await loadAnimationClip(animationSrc);
    if (!clip) {
      console.error('Clip not loaded: ', animationSrc);
      return;
    }
    clip.name = actionName;
    // sourcery skip: dont-self-assign-variables
    clip = translateAnimationsToOrigin([clip], this._armature!)[0];
    clip = alignToCenter(clip);

    /*
                // TODO: test closed-loop mode
                let angle = 1;
                if (action.includes("Backwards")) {
                    angle = -1;
                }
                if (action.includes("Strafe")) {
                    angle = 0.25;
                }
                closedLoop(clip, 0.1, angle);
         */

    console.log('Adding action: ', actionName, clip);
    this._actions.set(actionName, clip);
    this.setAction(actionName);

    if (this._paused === false) {
      // Automatically play the next animation if it's not currently paused.
      this.play();
    }

    return clip;
  }

  setAction(action: string) {
    if (!this._actions.has(action)) {
      console.error('Action not found: ', action);
      return;
    }
    this._nextAction = action;
    this._nextAnimationClip = this._actions.get(action)!;
  }
}

export const defaultAnimationControl = new DefaultAnimationControl();

// Create context for animation control with default values.
const AnimationControlContext = createContext<AnimationControl>(defaultAnimationControl);

// Context provider component
function AnimationProvider({ children }: { children: React.ReactNode }) {
  console.log('Rendering AnimationProvider: ', defaultAnimationControl, defaultAnimationControl.getMixer());
  return (
    <AnimationControlContext.Provider value={defaultAnimationControl} key="constAnimationProvider">
      {children}
    </AnimationControlContext.Provider>
  );
}

export const useAnimationControl = () => {
  return defaultAnimationControl as AnimationControl;
};

export { AnimationControlContext, AnimationProvider };
export type { AnimationControl };
