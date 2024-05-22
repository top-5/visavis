import { AnimationClip, AnimationMixer } from 'three';
import * as THREE from 'three';

export interface BoneState {
  bone: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

const ArmaturePosition: string = 'Armature.position';
const HipsPosition: string = 'Hips.position';
const HipsQuaternion: string = 'Hips.quaternion';
const HipsScale: string = 'Hips.scale';

const SmoothClipName: string = 'smooth';

export function alignToCenter(clip: AnimationClip): AnimationClip {
  // If the starting point is not at the origin, move it to the origin.
  for (let trackName of [ArmaturePosition, HipsPosition]) {
    const targetTrack: THREE.KeyframeTrack = clip.tracks.find(
      (track) => track.name === trackName
    ) as THREE.KeyframeTrack;
    if (!targetTrack) {
      continue;
    }
    const firstPos = new THREE.Vector3().fromArray(targetTrack.values.slice(0, 3));
    if (!firstPos.equals(new THREE.Vector3())) {
      for (let i = 0; i < targetTrack.times.length; i++) {
        targetTrack.values[i * 3] -= firstPos.x;
        targetTrack.values[i * 3 + 2] -= firstPos.z;
      }
    }
  }
  return clip;
}

/**
 * This function allows to create a closed loop animation clip. It takes the animation clip
 * and creates a circular path for the hips bone. The circular path is created by adjusting
 * the coordinates of the hips bone to create a circular path. The function also adjusts the
 * quaternion for rotation to face along the circular path. The function takes the clip,
 * threshold, and angleK as input parameters.
 *
 * @param clip Animation clip to modify in-place
 * @param threshold Threshold value that determines the distance between the start and end points
 * @param angleK Angle increment for the circular path. If angleK is 1, the circular path is 360 degrees.
 * If angleK is 0.5, the circular path is 180 degrees. If angleK is -1, the circular path is -360 degrees.
 * @returns Animation clip
 */
export function closedLoop(
  clip: AnimationClip,
  threshold = 0.1,
  angleK = 1,
  center: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): AnimationClip {
  // Assuming you have the `animationClip` with the tracks already
  const hipsTrack: THREE.KeyframeTrack = clip.tracks.find(
    (track) => track.name === HipsPosition
  ) as THREE.KeyframeTrack;
  const rotationTrack: THREE.KeyframeTrack = clip.tracks.find(
    (track) => track.name === HipsQuaternion
  ) as THREE.KeyframeTrack;

  // Step 1: Calculate the total length of the motion path
  let pathLength = 0;
  let previousPosition = new THREE.Vector3().fromArray(hipsTrack.values.slice(0, 3));

  for (let i = 1; i < hipsTrack.times.length; i++) {
    const currentPosition = new THREE.Vector3().fromArray(hipsTrack.values, i * 3);
    pathLength += currentPosition.distanceTo(previousPosition);
    previousPosition.copy(currentPosition);
  }

  // Step 2: Check if the end point of the path is significantly far from the starting point
  const startPosition = new THREE.Vector3().fromArray(hipsTrack.values.slice(0, 3));
  const endPosition = previousPosition;
  const distanceFromStartToEnd = startPosition.distanceTo(endPosition);

  if (distanceFromStartToEnd > threshold) {
    // Step 3: Adjust coordinates to create a circular path
    const radius = distanceFromStartToEnd / 2;
    // const center = startPosition.clone().lerp(endPosition, 0.5); // Center between start and end
    center.x = 0;
    center.z = 0;
    const angleIncrement = (angleK * (Math.PI * 2)) / (hipsTrack.times.length - 1);
    let currentAngle = 0;

    for (let i = 0; i < hipsTrack.times.length; i++) {
      // Calculate new x and z using circular coordinates
      const x = center.x + radius * Math.cos(currentAngle);
      const z = center.z + radius * Math.sin(currentAngle);
      hipsTrack.values[i * 3] = x;
      hipsTrack.values[i * 3 + 2] = z;

      // Adjust quaternion for rotation to face along the circular path
      const tangent = new THREE.Vector3(-Math.sin(currentAngle), 0, Math.cos(currentAngle));
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      quaternion.toArray(rotationTrack.values, i * 4);

      currentAngle += angleIncrement;
    }
  }

  return clip;
}

/**
 * This function allows to create a 360-degree rotation animation clip.
 * TODO: allow to specify rotation speed in Hz or Radians per second.
 *
 * @returns
 */
export function rotate360(): AnimationClip {
  // Times are in seconds
  const times = [0, 1.25, 2.5, 3.75, 5];
  let values: number[] = [];
  for (let i = 0; i < 5; i++) {
    let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (Math.PI / 2) * i, 0));
    values.push(quat.x, quat.y, quat.z, quat.w);
  }
  // Create the quaternion keyframe track
  const trackName = 'Hips.quaternion'; // The track applies to the 'quaternion' property of 'mesh'
  const track = new THREE.QuaternionKeyframeTrack(trackName, times, values);
  // Create an animation clip
  const clip = new AnimationClip('rotateY', -1, [track]);
  return clip;
}

/**
 * This function allows to morph the bone states from the current state to the next state.
 *
 * @param boneStates Initial bone states
 * @param nextBoneStates Next bone states
 * @param duration Duration of the transition
 * @param steps Number of steps in the transition
 * @returns Animation clip
 */
export function morphBoneStates(
  boneStates: Map<string, BoneState>,
  nextBoneStates: Map<string, BoneState>,
  duration: number,
  steps: number
): AnimationClip {
  const tracks: Map<string, THREE.KeyframeTrack> = new Map<string, THREE.KeyframeTrack>();
  let boneNames = Array.from(boneStates.keys());
  for (let i = 0; i < boneNames.length; i++) {
    let boneName = boneNames[i];
    let boneState = boneStates.get(boneName)!;
    let nextBoneState = nextBoneStates.get(boneName);
    if (!nextBoneState) {
      console.log('Bone not found in next bone states: ', boneName);
      continue;
    }
    let srcBone = boneState.bone;
    let positionTrackName = `${boneName}.position`;
    let quaternionTrackName = `${boneName}.quaternion`;
    let positionValues: number[] = [];
    let quaternionValues: number[] = [];
    let timeValues: number[] = [];
    for (let j = 0; j < steps; j++) {
      let alpha = j / steps;
      timeValues.push(alpha * duration);
      if (boneName === 'Hips') {
        {
          let pos = srcBone.position.lerpVectors(boneState.position, nextBoneState.position, alpha);
          positionValues.push(pos.x, pos.y, pos.z);
        }
      }
      let quat = srcBone.quaternion.slerpQuaternions(boneState.quaternion, nextBoneState.quaternion, alpha);
      quaternionValues.push(quat.x, quat.y, quat.z, quat.w);
      if (positionValues.length !== 0) {
        tracks.set(
          positionTrackName,
          new THREE.VectorKeyframeTrack(positionTrackName, timeValues, positionValues, THREE.InterpolateLinear)
        );
      }
      if (quaternionValues.length !== 0) {
        tracks.set(
          quaternionTrackName,
          new THREE.QuaternionKeyframeTrack(quaternionTrackName, timeValues, quaternionValues, THREE.InterpolateLinear)
        );
      }
    }
  }
  // sourcery skip: inline-immediately-returned-variable
  const clip = new AnimationClip(SmoothClipName, duration, Array.from(tracks.values()));
  console.log('Smooth clip: ', clip);
  return clip;
}

/**
 * This helper function allows to convert the bone states from the animation clip to the bone states map.
 * It takes the very first frame of the animation clip and extracts the bone states from it.
 * It is useful for creating the initial bone states for the animation.
 *
 * TODO:
 * - Add support for the scale.
 * - Allow to specify time for the frame.
 *
 * @param clip
 * @returns
 */
export function clipToBoneState(clip: AnimationClip): Map<string, BoneState> {
  let boneStates: Map<string, BoneState> = new Map<string, BoneState>();
  let tracks = clip.tracks!;
  for (let i = 0; i < tracks.length; i++) {
    let track = tracks[i] as THREE.VectorKeyframeTrack;
    let boneName = track.name.split('.')[0];
    let boneState = boneStates.get(boneName);
    if (!boneState) {
      boneState = {
        bone: new THREE.Object3D(),
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion()
      };
      boneStates.set(boneName, boneState);
    }
    if (track.name.includes('position')) {
      let pos = new THREE.Vector3(track.values[0], track.values[1], track.values[2]);
      boneState.position = pos;
    }
    if (track.name.includes('quaternion')) {
      let quat = new THREE.Quaternion(track.values[0], track.values[1], track.values[2], track.values[3]);
      boneState.quaternion = quat;
    }
  }
  let hipsState = boneStates.get('Hips');
  if (hipsState) {
    let hips = hipsState.bone;
    hips.position.copy(hipsState.position);
    hips.quaternion.copy(hipsState.quaternion);
    hips.position.applyQuaternion(hips.quaternion);
  }
  return boneStates;
}

/**
 * This function allows to create a smooth transition between the current clip and the next clip.
 * It uses the bone states from the current clip and the next clip to create a smooth transition.
 *
 * @param mixer Animation mixer
 * @param armature Armature object
 * @param currentClip Current animation clip
 * @param nextClip Next animation clip
 * @param duration Duration of the transition
 * @returns Animation clip
 */
export function smoothTransform(
  mixer: AnimationMixer,
  armature: THREE.Object3D,
  currentClip: AnimationClip,
  nextClip: AnimationClip,
  duration: number
): AnimationClip {
  const boneStates: Map<string, BoneState> = new Map<string, BoneState>();
  armature!.traverse((bone) => {
    if (bone instanceof THREE.Bone) {
      let boneName = bone.name;
      bone.updateMatrixWorld();
      let pos = bone.position;
      boneStates.set(boneName, {
        bone,
        position: pos.clone(),
        quaternion: bone.quaternion.clone()
      });
    }
  });
  console.log('Source bones: ', boneStates.keys());

  const nextBoneStates: Map<string, BoneState> = clipToBoneState(nextClip);
  console.log('Target bones: ', nextBoneStates.keys());

  const fps = 30;
  const steps = duration * fps;
  return morphBoneStates(boneStates, nextBoneStates, duration, steps);
}

/**
 * This function allows to drag the armature to the specified point in the scene.
 * It creates an animation clip that moves the armature to the specified point.
 *
 * @param armature Armature object
 * @param point Target point
 * @param duration Duration of the animation
 * @returns Animation clip
 */
export function dragToPoint(armature: THREE.Object3D, point: THREE.Vector3, duration: number): AnimationClip {
  let boneStates: Map<string, BoneState> = new Map<string, BoneState>();
  armature.traverse((bone) => {
    if (bone instanceof THREE.Bone) {
      let boneName = bone.name;
      let pos = bone.position;
      boneStates.set(boneName, {
        bone,
        position: pos.clone(),
        quaternion: bone.quaternion.clone()
      });
    }
  });

  let targetBoneStates: Map<string, BoneState> = new Map<string, BoneState>();
  armature.traverse((bone) => {
    if (bone instanceof THREE.Bone) {
      let boneName = bone.name;
      let pos = bone.position;
      let targetPos = pos.clone().lerp(point, 1);
      targetBoneStates.set(boneName, {
        bone,
        position: targetPos,
        quaternion: bone.quaternion.clone()
      });
    }
  });

  const fps = 30;
  const steps = duration * fps;
  return morphBoneStates(boneStates, targetBoneStates, duration, steps);
}

/**
 * This function applies the bones to the armature. It is together with the clipTimeToBones function.
 *
 * @param armature
 * @param bones
 */
export function applyBonesToArmature(armature: THREE.Object3D, bones: THREE.Bone[], allowDebug: boolean = true) {
  for (let i = 0; i < bones.length; i++) {
    let bone = bones[i];
    let boneName = bone.name;
    let armatureBone = armature.getObjectByName(boneName) as THREE.Bone;
    if (boneName === 'Armature' && allowDebug) {
      // Debug root armature bone is intentionally named "Armature.Debug".
      // Copy values from "Armature" to "Armature.Debug".
      armatureBone = armature.getObjectByName('Armature.Debug') as THREE.Bone;
    }
    if (armatureBone) {
      armatureBone.position.copy(bone.position.clone());
      armatureBone.quaternion.copy(bone.quaternion.clone());
      armatureBone.scale.copy(bone.scale.clone());
    }
  }
  armature.updateMatrixWorld();
  armature.matrixWorldNeedsUpdate = true;
}

/**
 * This function converts the animation clip time to bones positions, rotations and scales for the armature.
 * Result is an array of bones that can be applied to the armature using the applyBonesToArmature function.
 *
 * If time is 0, the function will return the bones at the start of the animation.
 * If time is -1, the function will return the bones at the end of the animation.
 * If time is greater than the duration of the animation, the function will return the bones at the end.
 *
 * @param armature
 * @param animation
 * @param time
 * @returns
 */
export function clipTimeToBones(armature: THREE.Object3D, animation: AnimationClip, time: number = 0) {
  // Consider that we stop at the end of the animation.
  // Otherwise we could have used the modulo operator.
  if (time > animation.duration) {
    time = animation.duration;
  }

  if (time == -1) {
    time = animation.duration;
  }

  armature.traverse((object) => {
    if (object! instanceof THREE.Bone) {
      return;
    }
    let bone = object as THREE.Bone;
    let boneName = bone.name;
    let boneTracks = animation.tracks.filter((track) => track.name.includes(boneName));
    for (let j = 0; j < boneTracks.length; j++) {
      let track = boneTracks[j];
      console.log('Track name: ', track.name, ' type: ', track.ValueTypeName);
      if (track.name.includes('.position')) {
        // Cast track as positions track
        let interpolant = track.createInterpolant();
        let position: THREE.Vector3 = interpolant.evaluate(time) as THREE.Vector3;
        if (!position) {
          position = new THREE.Vector3(0, 0, 0);
        }
        bone.position.copy(position);
      }
      if (track.name.includes('.quaternion')) {
        // Cast track as quaternion track
        let interpolant = track.createInterpolant();
        let quaternion = interpolant.evaluate(time) as THREE.Quaternion;
        if (!quaternion) {
          quaternion = new THREE.Quaternion(0, 0, 0, 1);
        }
        bone.quaternion.copy(quaternion);
      }
      if (track.name.includes('.scale')) {
        // Cast track as scale track
        let interpolant = track.createInterpolant();
        let scale = interpolant.evaluate(time) as THREE.Vector3;
        if (!scale) {
          scale = new THREE.Vector3(1, 1, 1);
        }
        bone.scale.copy(scale);
      }
    }
  });
}
