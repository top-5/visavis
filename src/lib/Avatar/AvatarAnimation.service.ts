import {
  AnimationClip,
  Group,
  KeyframeTrack,
  Vector3,
  Quaternion,
  Object3D,
  Matrix4,
  Euler,
  QuaternionKeyframeTrack
} from 'three';

import { FBXLoader, GLTFLoader } from 'three-stdlib';

export interface ClipWithType {
  group: Group;
  isFbx: boolean;
}

const MIXAMO_PREFIX = 'mixamorig';
const POSITION_SUFFIX = '.position';
const DEFAULT_SCALE = 0.01;

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

/**
 * Test function to create a 360 degree rotation animation clip.
 * @returns
 */
export function rotate360(): AnimationClip {
  // Times are in seconds
  const times = [0, 1.25, 2.5, 3.75, 5];
  let values: number[] = [];
  for (let i = 0; i < 5; i++) {
    let quat = new Quaternion().setFromEuler(new Euler(0, (Math.PI / 2) * i, 0));
    values.push(quat.x, quat.y, quat.z, quat.w);
  }
  // Create the quaternion keyframe track
  const trackName = 'Hips.quaternion'; // The track applies to the 'quaternion' property of 'mesh'
  const track = new QuaternionKeyframeTrack(trackName, times, values);
  // Create an animation clip
  const clip = new AnimationClip('rotateY', -1, [track]);
  return clip;
}

/**
 * Animations from mixamo.com have a different coordinate system.
 * This function inverts the rotation of the armature to match the THREE.js
 * scene. If animation contains Armature.quaternion track, it is removed and
 * the inverse is applied to root bone - Hips. All other quaternion and position
 * tracks are relative to the Hips bone and do not need to be modified.
 *
 * @param animations
 * @param armature
 * @returns
 */
export function invertArmatureRotation(animations: AnimationClip[], armature: Object3D): AnimationClip[] {
  return animations.map((animation) => {
    const { tracks } = animation;
    let armatureQuat = new Quaternion();
    let armatureQuatInverse = new Quaternion();
    let armatureEuler = new Euler().setFromQuaternion(armatureQuat);

    // Find and remove the Armature.quaternion track
    const filteredTracks = tracks.filter((track) => {
      if (track.name === 'Armature.quaternion') {
        const quat = new Quaternion(track.values[0], track.values[1], track.values[2], track.values[3]);
        armatureQuat = quat.clone();
        armatureQuatInverse = quat.clone().invert();
        armatureEuler = new Euler().setFromQuaternion(quat);
        return false; // Remove this track
      }
      return true;
    });

    // const calcArmature = armature.clone();
    // calcArmature.setRotationFromQuaternion(armatureQuat);
    // calcArmature.updateMatrixWorld(true);

    // Apply the inverse quaternion to all other quaternion and position tracks
    filteredTracks.forEach((track) => {
      let boneName = track.name.split('.')[0];
      // console.log("Track: ", track.name, "Bone: ", boneName);
      let bone = armature.getObjectByName(boneName);
      if (bone && boneName === 'Hips') {
        if (track.name.includes('.quaternion')) {
          for (let i = 0; i < track.values.length; i += 4) {
            let quat = new Quaternion(track.values[i], track.values[i + 1], track.values[i + 2], track.values[i + 3]);
            let euler = new Euler().setFromQuaternion(quat);
            let newEuler = new Euler(euler.x + armatureEuler.x, euler.y + armatureEuler.y, euler.z + armatureEuler.z);
            quat.setFromEuler(newEuler);
            track.values[i + 0] = quat.x;
            track.values[i + 1] = quat.y;
            track.values[i + 2] = quat.z;
            track.values[i + 3] = quat.w;
          }
        }
        if (track.name.includes('.position')) {
          for (let i = 0; i < track.values.length; i += 3) {
            const object = new Object3D();
            object.position.fromArray(track.values.slice(i, i + 3));
            let pos = object.position.clone().applyEuler(armatureEuler);
            track.values[i + 0] = pos.x;
            track.values[i + 1] = pos.y;
            track.values[i + 2] = pos.z;
          }
        }
      }
      return track;
    });
    return animation;
  });
}

export function translateAnimationsToOrigin(animations: AnimationClip[], armature: Object3D) {
  const hipsBone = armature.children.find((bone) => bone.name.includes('Hips'));
  console.log('Hips bone: ', hipsBone);
  const hipsInitialPos = new Vector3();
  const hipsInitialQuat = new Quaternion();
  // Extract from animation if available
  animations.forEach((clip) => {
    clip.tracks.forEach((track) => {
      if (track.name === 'Hips.position') {
        hipsInitialPos.fromArray(track.values.slice(0, 3));
      }
      if (track.name === 'Hips.quaternion') {
        hipsInitialQuat.fromArray(track.values.slice(0, 4));
      }
    });
  });
  for (let i = 0; i < animations.length; i++) {
    let animation = animations[i];
    let track = animation.tracks[0];
    if (track.name === 'Armature.quaternion') {
      console.log('Found Armature.quaternion track');
      return invertArmatureRotation(animations, armature);
    }
  }
  return animations;
}

export function normaliseFbxAnimation(fbx: Group, index: number = 0) {
  console.log('Index: ', index, '/', fbx.animations.length - 1);
  let { tracks } = fbx.animations[index];
  console.log('X: ', fbx.position.x, 'Y: ', fbx.position.y, 'Z: ', fbx.position.z);
  console.log('Scale: ', fbx.scale.x, fbx.scale.y, fbx.scale.z);
  console.log('Rotation: ', fbx.rotation.x, fbx.rotation.y, fbx.rotation.z);
  // Reset rotation
  fbx.rotation.set(0, 0, 0);
  console.log('Tracks length: ', tracks.length);

  let scale = DEFAULT_SCALE;
  if (fbx.animations[0]?.name == 'mixamo.com') {
    // Assume that mixamo.com unmodded rigs need a different scale factor
    scale = 1;
  }

  for (let i = 0; i < tracks.length; i++) {
    // console.log("Track name: ", tracks[i].name);
    const hasMixamoPrefix = tracks[i].name.includes(MIXAMO_PREFIX);
    if (hasMixamoPrefix) {
      // Remove Mixamo prefix to normalize track names
      tracks[i].name = tracks[i].name.replace(MIXAMO_PREFIX, '');
      scale = 1;
    }
    if (tracks[i].name.includes(POSITION_SUFFIX)) {
      for (let j = 0; j < tracks[i].values.length; j += 3) {
        tracks[i].values[j + 0] = tracks[i].values[j + 0] * scale;
        tracks[i].values[j + 1] = tracks[i].values[j + 1] * scale;
        tracks[i].values[j + 2] = tracks[i].values[j + 2] * scale;
      }
    }
  }
  return fbx.animations[index];
}

export const loadBlobFile = async (blob: Blob): Promise<ClipWithType> => {
  const buffer = await blob.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  const headerLength = 18;
  const header = textDecoder.decode(buffer.slice(0, headerLength));

  // Check if the header matches the FBX binary signature
  if (header === 'Kaydara FBX Binary') {
    const group = (await fbxLoader.loadAsync(URL.createObjectURL(blob))) as unknown as Group;
    return { group, isFbx: true };
  } else {
    const group = (await gltfLoader.parseAsync(buffer, '')) as unknown as Group;
    return { group, isFbx: false };
  }
};

export const loadPathFile = async (source: string): Promise<ClipWithType> => {
  try {
    return {
      group: (await gltfLoader.loadAsync(source)) as unknown as Group,
      isFbx: false
    };
  } catch (e) {
    return {
      group: (await fbxLoader.loadAsync(source)) as Group,
      isFbx: true
    };
  }
};

export const loadAnimationClip = async (source: Blob | string): Promise<AnimationClip> => {
  console.log('Loading animation clip: ', source);
  const animation = source instanceof Blob ? await loadBlobFile(source) : await loadPathFile(source);
  console.log('Loaded animation clip: ', animation);
  return animation.isFbx ? normaliseFbxAnimation(animation.group) : animation.group.animations[0];
};
