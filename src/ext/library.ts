// external-module.ts
import { Canvas } from '@react-three/fiber';
import type * as THRE3 from 'three';
import type * as Rapi3r from '@dimforge/rapier3d-compat';

export class DynamicObject {
  private THREE: typeof THRE3;
  private Rapier: typeof Rapi3r;

  constructor(THREE: typeof THRE3, Rapier: typeof Rapi3r) {
    this.THREE = THREE;
    this.Rapier = Rapier;
  }

  addObjectToScene(scene: any, world: any) {
    // Use THREE library types passed in constructor
    const THREE = this.THREE;
    const Rapier = this.Rapier;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 10, 0);

    // Create a Rapier rigidbody and collider
    const rigidBodyDesc = new Rapier.RigidBodyDesc(Rapier.RigidBodyType.Dynamic);
    rigidBodyDesc.setTranslation(cube.position.x, cube.position.y, cube.position.z);
    rigidBodyDesc.enabled = true;
    rigidBodyDesc.mass = 1.0;
    rigidBodyDesc.angularDamping = 0.5;
    rigidBodyDesc.linearDamping = 0.5;
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    rigidBody.userData = cube;
    
    const colliderDesc = new Rapier.ColliderDesc(new Rapier.Cuboid(0.5, 0.5, 0.5));
    world.createCollider(colliderDesc, rigidBody.handle);

    // Attach the rigidBody to the THREE.Mesh
    cube.userData.rigidBody = rigidBody;
    
    scene.add(cube);
    world.add(rigidBody);
  }

}
