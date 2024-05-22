import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier';
import React, { useMemo } from 'react';
import { FC, RefObject, useEffect } from 'react';
import { Bone, SphereGeometry, MeshBasicMaterial, LineBasicMaterial, Mesh, Object3D } from 'three';
import * as THREE from 'three';
import { CylinderGeometry, Vector3, Quaternion } from 'three';
import { Rotation, Vector } from '@dimforge/rapier3d-compat/math';

interface BoneHelperInterface {
  armature: Object3D | null;
  boneColor: number;
  jointColor: number;
  alpha: number;
  uuid: string;
  children: {
    [key: string]: Object3D;
  };
  update: () => void;
}

/**
 * Cache for bone helpers across multiple armatures.
 */
export class BoneHelperCache<T extends BoneHelperInterface> {
  cache: Map<string, T> = new Map<string, T>();

  /**
   * Add a bone helper to the cache.
   * @param key
   * @param value
   */
  add = (key: string, value: T) => {
    this.cache.set(key, value);
  };

  /**
   * Remove a bone helper from the cache.
   */
  remove = (key: string) => {
    this.cache.delete(key);
  };

  /**
   * Get a bone helper from the cache.
   *
   * @param key
   * @returns
   */
  get = (key: string) => {
    return this.cache.get(key);
  };

  /**
   * Clear the cache.
   */
  clear = () => {
    this.cache.clear();
  };

  /**
   * Initialize a bone helper for an armature.
   *
   * @param armature
   * @param T
   * @returns
   */
  init = (armature: Object3D, T: new () => T): T => {
    let key = armature.uuid;
    // let hash = 0;
    // armature.traverse((child) => { hash += child.uuid.charCodeAt(0); });
    let boneHelper = this.cache.get(key); // + "/" + hash);
    if (!boneHelper) {
      boneHelper = new T();
      boneHelper.armature = armature;
      this.add(key, boneHelper);
    }
    return boneHelper as T;
  };
}

export class BoneHelper implements BoneHelperInterface {
  armature: Object3D | null = null;
  boneColor: number = 0;
  jointColor: number = 0;
  alpha: number = 1;
  children: { [key: string]: Object3D } = {};
  uuid: string = '';

  constructor() {
    this.uuid = THREE.MathUtils.generateUUID();
  }

  update() {
    if (!this.armature) {
      console.log('No armature set for BoneHelperStandard');
    }

    this.armature!.traverse((child) => {
      if (child instanceof Bone) {
        let boneName = child.name;
        let jointName = boneName + '_helper_sphere';
        let jointHelper = this.children[jointName];
        if (!jointHelper) {
          // Tiny sphere with a radius of 0.1
          const sphereGeometry = new SphereGeometry(0.01, 16, 16);
          const sphereMaterial = new MeshBasicMaterial({ color: this.jointColor });
          const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
          sphereMesh.name = jointName;
          child.add(sphereMesh);
          this.children[jointName] = sphereMesh;
        } else {
          const sphereMesh = jointHelper as Mesh;
          (sphereMesh.material as MeshBasicMaterial).color.setHex(this.jointColor);
          (sphereMesh.material as MeshBasicMaterial).needsUpdate = true;
        }

        if (child.parent instanceof Bone) {
          let helperName = boneName + '_helper_line';
          let lineHelper = this.children[helperName];
          if (!lineHelper) {
            // Lines
            const points = [];
            // Child bone position (local space)
            points.push(new THREE.Vector3(0, 0, 0));
            points.push(child.parent.worldToLocal(child.getWorldPosition(new THREE.Vector3())));
            const lineMaterial = new LineBasicMaterial({ color: this.boneColor });
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            line.name = helperName;
            child.parent.add(line);
            this.children[line.name] = line;
          } else {
            // const line = helper as THREE.Line;
            // const geometry = line.geometry as THREE.BufferGeometry;
            // const position = geometry.attributes.position as THREE.BufferAttribute;
            // position.setXYZ(1, child.parent.worldToLocal(child.getWorldPosition(new THREE.Vector3())).x, child.parent.worldToLocal(child.getWorldPosition(new THREE.Vector3())).y, child.parent.worldToLocal(child.getWorldPosition(new THREE.Vector3())).z);
            // position.needsUpdate = true;
            ((lineHelper as THREE.Line).material as LineBasicMaterial).color.setHex(this.boneColor);
            ((lineHelper as THREE.Line).material as LineBasicMaterial).needsUpdate = true;
          }
        }
      }
      child.updateMatrixWorld(true);
    });
  }
}

export class RigidBoneHelper implements BoneHelperInterface {
  armature: Object3D | null = null;
  alpha: number = 1;
  boneColor: number = 0;
  jointColor: number = 0;
  children: { [key: string]: Object3D } = {};
  uuid: string = '';

  constructor() {
    this.uuid = THREE.MathUtils.generateUUID();
  }

  update() {
    if (!this.armature) {
      console.log('No armature set for BoneHelperStandard');
    }

    const boneSizeHints: { [key: string]: number } = {
      Hips: 7,
      Spine: 8,
      Spine1: 8,
      Spine2: 7,
      Neck: 3,
      Head: 4,
      HeadTop_End: 3,
      LeftShoulder: 6.5,
      LeftArm: 5,
      LeftArmTwist: 5,
      RightShoulder: 6.5,
      RightArm: 5,
      RightArmTwist: 5,
      LeftFoot: 0.7,
      RightFoot: 0.7
    };

    this.armature!.traverse((child) => {
      if (child instanceof Bone) {
        // console.log('Bone: ', child.name);
        let boneName = child.name;
        let jointName = boneName + '_helper_sphere';
        let jointHelper = this.children[jointName];
        if (!jointHelper) {
          // Tiny sphere with a radius of 0.1
          const sphereGeometry = new SphereGeometry(0.01, 16, 16);
          const sphereMaterial = new MeshBasicMaterial({ color: this.jointColor });
          const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
          sphereMesh.name = jointName;
          sphereMesh.userData = { parent: child };
          sphereMesh.visible = this.alpha > 0;
          child.add(sphereMesh);
          this.children[jointName] = sphereMesh;
        } else {
          const sphereMesh = jointHelper as Mesh;
          sphereMesh.visible = this.alpha > 0;
          (sphereMesh.material as MeshBasicMaterial).color.setHex(this.jointColor);
          (sphereMesh.material as MeshBasicMaterial).needsUpdate = true;
        }

        if (child.parent instanceof Bone) {
          let helperName = boneName + '_helper_cylinder';
          let cylinderHelper = this.children[helperName];
          if (!cylinderHelper) {
            // Lines
            const points = [];
            // Child bone position (local space)
            points.push(new Vector3(0, 0, 0));
            points.push(child.parent.worldToLocal(child.getWorldPosition(new Vector3())));
            const distance = points[0].distanceTo(points[1]);
            const sizeHint = boneSizeHints[boneName] ?? 1;
            const radius = 0.15 * distance * sizeHint;
            const cylinderGeometry = new CylinderGeometry(radius, radius, distance, 8, 8, false);
            const cylinderMaterial = new MeshBasicMaterial({ color: this.boneColor });
            cylinderHelper = new Mesh(cylinderGeometry, cylinderMaterial);
            cylinderHelper.name = helperName;

            // Count middle point
            const middle = new Vector3();
            middle.addVectors(points[0], points[1]).divideScalar(2);
            cylinderHelper.position.copy(middle);
            cylinderHelper.userData = { parent: child.parent };
            cylinderHelper.visible = this.alpha > 0;
            child.parent.add(cylinderHelper);
            this.children[helperName] = cylinderHelper;
          } else {
            cylinderHelper.visible = this.alpha > 0;
            ((cylinderHelper as Mesh).material as MeshBasicMaterial).color.setHex(this.boneColor);
            ((cylinderHelper as Mesh).material as MeshBasicMaterial).needsUpdate = true;
          }
        }
      }
      child.updateMatrixWorld(true);
    });
  }
}

export function makeMeshesTransparent(armature: Object3D, alpha: number) {
  armature.traverse((child) => {
    if (child instanceof Mesh || child instanceof THREE.SkinnedMesh) {
      // Keep the helper objects opaque.
      if (!child.name.includes('helper')) {
        if (alpha === 0) {
          child.material.transparent = false;
          child.visible = false;
        } else {
          child.material.transparent = true;
          child.material.opacity = alpha;
          child.visible = true;
        }
        child.material.needsUpdate = true;
      }
    }
  });
}

function changeVisibility(boneHelper: BoneHelper, visible: boolean) {
  for (let key in boneHelper.children) {
    let child = boneHelper.children[key];
    child.visible = visible;
    child.matrixWorldNeedsUpdate = true;
  }
}

export interface BoneHelpersProps {
  armatureRef: RefObject<Object3D>;
  alpha?: number;
  boneColor?: number;
  jointColor?: number;
  visible?: boolean;
  // Add type for class that can be passed as argument to init as 2nd parameter
  className?: new () => BoneHelperInterface;
}

const cache = new BoneHelperCache<BoneHelperInterface>();
export const useBoneHelperCache = () => {
  return cache;
};

export const RigidBoneMapper: React.FC<{ helper: BoneHelperInterface }> = ({ helper }) => {
  const { world } = useRapier();
  let offset = 0;

  function alignRigidBodyToBones() {
    let i = 0;
    world?.bodies.forEach((body) => {
      i++;
      let userData = body.userData as any;
      if (userData && userData.object) {
        let obj: Object3D = userData.object;
        let rigidBody = body as RapierRigidBody;
        let parent: Bone = userData.parent as Bone;
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();

        parent.getWorldPosition(position);
        parent.getWorldQuaternion(quaternion);
        parent.getWorldScale(scale);

        let childPosition = new Vector3();
        obj.getWorldPosition(childPosition);
        obj.getWorldQuaternion(quaternion);
        if (helper.alpha > 0) {
          obj.visible = true;
          let mat = (obj as Mesh).material as MeshBasicMaterial;
          let color = ((obj as Mesh).material as MeshBasicMaterial).color;
          obj.updateMatrix();
          color.r = (position.x + childPosition.x) % 1; // (color.r + 0.01) % 1;
          color.g = (position.y + childPosition.y) % 1; // (color.g - 0.01) % 1;
          color.b = (position.z + childPosition.z) % 1; // (color.b + 0.01) % 1;
          ((obj as Mesh).material as MeshBasicMaterial).color.set(color);
          ((obj as Mesh).material as MeshBasicMaterial).needsUpdate = true;
          ((obj as Mesh).material as MeshBasicMaterial).opacity = helper.alpha;
        } else {
          obj.visible = false;
          let mat = (obj as Mesh).material as MeshBasicMaterial;
          mat.visible = false;
          mat.transparent = false;
          mat.opacity = 1;
          mat.needsUpdate = true;
        }
        let tra: Vector = { x: position.x, y: position.y, z: position.z };
        rigidBody.setTranslation(tra, false);
        let rot: Rotation = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
        rigidBody.setRotation(rot, true);
      }
    });
  }

  let frameCount = 0;
  useFrame(() => {
    if (frameCount % 1 === 0) {
      // Only adjust the physics every 5th frame as a perf optimization
      alignRigidBodyToBones();
    }
    frameCount++;
  });

  useEffect(() => {
    return () => {
      if (!world?.bodies) {
        return;
      }
      /*
            world?.bodies.forEach((body) => {
                let userData = body.userData as any;
                if (userData && userData.parent && userData.child) {
                    let child: Object3D = userData.child;
                    let bone: Bone = userData.parent as Bone;
                    bone.add(child);
                    child.position.set(0, 0, 0);
                    child.quaternion.set(0, 0, 0, 1);
                    child.scale.set(1, 1, 1);
                    child.updateMatrix();
                }
                world?.removeRigidBody(body);
            });
 */
    };
  }, []);

  if (!helper.children) {
    return null;
  }

  const BonePhysics: React.FC<{ name?: string; object: Object3D }> = ({ name, object }) => {
    const parent = object.userData.parent as Bone;
    const mesh = object as Mesh;

    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();

    parent.getWorldPosition(position);
    parent.getWorldQuaternion(quaternion);
    parent.getWorldScale(scale);

    return (
      <RigidBody
        shape="trimesh"
        name={name}
        type="kinematicPosition"
        restitution={0.1}
        friction={0.5}
        userData={{ parent: parent, object: object }}
        position={position}
        quaternion={quaternion}
        scale={scale}
      >
        <mesh
          geometry={mesh.geometry}
          material={mesh.material}
          position={object.position}
          rotation={object.rotation}
          quaternion={object.quaternion}
          scale={object.scale}
        />
      </RigidBody>
    );
  };

  return (
    <>
      {Object.keys(helper.children)
        .filter((key) => key.includes('_helper_'))
        .map((key) => {
          let object = helper.children[key];
          let name = `RigidBody_${object.name}`;
          return <BonePhysics key={name} name={name} object={object} />;
        })}
    </>
  );
};

export const BoneHelpers: FC<BoneHelpersProps> = ({
  armatureRef,
  alpha = 1,
  boneColor = 0x00ff00,
  jointColor = 0x0000ff,
  visible = false,
  className = BoneHelper
}) => {
  // Contents of this cache are shared across all instances of BoneHelpers.
  // This is done to keep precise control over the bone helpers and to avoid
  // creating multiple instances of the same bone helpers. Memory usage is
  // controlled: when the component is unmounted, the bone helpers are removed
  // from the scene and the cache is cleared.
  const cache = useBoneHelperCache();
  const { scene } = useThree();
  const [armature, setArmature] = React.useState<Object3D | null>(armatureRef.current);

  const updateHelper = (): BoneHelperInterface | undefined => {
    if (!armature) return;
    const boneHelper = cache.init(armature, className);
    boneHelper.boneColor = boneColor;
    boneHelper.jointColor = jointColor;
    boneHelper.alpha = alpha;
    makeMeshesTransparent(armature, visible ? alpha : 1);
    boneHelper.update();
    changeVisibility(boneHelper, visible && alpha > 0);
    armature.matrixWorldNeedsUpdate = true;
    return boneHelper;
  };

  const hideHelper = () => {
    if (!armature) return;
    const boneHelper = cache.get(armature.uuid);
    if (boneHelper) {
      makeMeshesTransparent(armature, 1);
      changeVisibility(boneHelper, false);
      armature.matrixWorldNeedsUpdate = true;
    }
  };

  useMemo(() => {
    if (!armature) return;
    updateHelper();
    return () => {
      hideHelper();
    };
  }, [armature]);

  useEffect(() => {
    if (armatureRef.current) {
      setArmature(armatureRef.current);
    }
  }, [armatureRef, armatureRef.current]);

  useEffect(() => {
    console.log('MOUNT BoneHelpers for Armature: ', armature?.uuid);
    return () => {
      console.log('UNMOUNT BoneHelpers for Armature: ', armature?.uuid);
      hideHelper();
      if (armature?.uuid) {
        cache.remove(armature?.uuid);
      }
    };
  }, []);

  function objectCount() {
    let objectCount = 0;
    scene.traverse(function (object) {
      objectCount++;
    });
    return objectCount;
  }

  console.log('Scene object count: ' + objectCount());
  if (className === RigidBoneHelper && armature) {
    const helper = updateHelper();
    if (helper && helper.children) {
      return (
        <>
          <RigidBoneMapper helper={helper!} />
        </>
      );
    }
  }

  return null;
};
