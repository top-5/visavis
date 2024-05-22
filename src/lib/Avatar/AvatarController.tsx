import * as THREE from 'three';
import { findTopParent } from 'src/lib/utils';
import { AnimationControl } from 'src/lib/Animation/AnimationContext';
const { DEG2RAD } = THREE.MathUtils;

type Properties = { [key: string]: any };

export class AvatarController {
  animationControl: AnimationControl | null = null;
  public target: THREE.Object3D | null = null;
  public properties: Properties = {};
  public moveToPointStep: number = 0.1;
  public _controlsEnabled: boolean = true;

  set controlsEnabled(value: boolean) {
    this._controlsEnabled = value;
  }

  get controlsEnabled() {
    return this._controlsEnabled;
  }

  constructor() {
    console.log('Creating AvatarController');
    this.registerKeyListener();
  }

  setAnimationControl(animationControl: AnimationControl) {
    this.animationControl = animationControl;
  }

  public rotateArmatureAroundHips(angle: number) {
    let armature = this.getTarget();
    armature = armature?.getObjectByName('Armature') ?? armature;
    if (!armature) {
      console.error('No armature found');
      return;
    }

    let model = findTopParent(armature); // Ensure findTopParent properly returns the root object that is part of the scene
    const hips = armature.getObjectByName('Hips');
    if (!hips) {
      console.error('Hips bone not found');
      return;
    }

    // Get the world position of the hips to maintain it
    const hipsWorldPosition = new THREE.Vector3();
    hips.getWorldPosition(hipsWorldPosition);

    // The initial position of the model
    const modelPosition = new THREE.Vector3();
    model.getWorldPosition(modelPosition);

    // Calculate the direction vector from model to hips
    const direction = new THREE.Vector3().subVectors(modelPosition, hipsWorldPosition);

    // Create a rotation matrix about the world Y axis
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(angle);

    // Apply the rotation matrix to the direction vector
    direction.applyMatrix4(rotationMatrix);

    // Calculate the new position for the model
    const newModelPosition = new THREE.Vector3().addVectors(hipsWorldPosition, direction);
    model.position.copy(newModelPosition);

    // Apply the rotation to the model
    model.rotateY(angle);

    // Update matrices to reflect changes
    model.updateMatrixWorld(true); // true to update children, ensuring all transformations are applied properly
  }

  doRotation(angle: number = 0) {
    if (!this.animationControl?.paused) {
      this.animationControl?.pause();
      this.rotateArmatureAroundHips(angle * DEG2RAD);
      this.animationControl?.play();
      return;
    }

    this.rotateArmatureAroundHips(angle * DEG2RAD);
  }

  keyboardEventHandler(event: KeyboardEvent) {
    if (!this.controlsEnabled) {
      // Controls are disabled
      return;
    }
    console.log('AvatarController::keyboardEventHandler()');
    const hips = this.target?.getObjectByName('Hips');
    if (!hips) {
      // Hips required for movement
      return;
    }
    if (event.key === 'Space') {
    } else if (event.key === 'w' || event.key === 'ArrowUp') {
      // this.step2D(0, -1);
    } else if (event.key === 's' || event.key === 'ArrowDown') {
      // this.step2D(0, 1);
    } else if (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight') {
      const angle = event.key === 'a' || event.key === 'ArrowLeft' ? 5 : -5;
      this.doRotation(angle);
    }
  }

  public destroy() {
    console.log('AvatarController::destroy()');
    this.unregisterKeyListener();
  }

  public registerKeyListener() {
    document.addEventListener('keydown', (evt) => this.keyboardEventHandler(evt));
  }

  public unregisterKeyListener() {
    document.removeEventListener('keydown', (evt) => this.keyboardEventHandler(evt));
  }

  public setTarget(target: THREE.Object3D) {
    this.target = target;
  }

  public getTarget(): THREE.Object3D | null {
    // This function returns the target object of the controller.
    // It could be either the object itself or the parent object
    // of the object. Either of these objects are in the world
    // coordinate system, so the position and rotation of the
    // target object can be used to move the object around the scene.
    if (!this.target || !this.target!.parent) {
      return null;
    }
    // Scene->avatarBody->model->Armature   - for Physics; OR
    // Scene->model->Armature               - for Animation with no Physics
    let target = findTopParent(this.target!);
    return target;
  }

  public async moveToPoint(point: THREE.Vector3) {
    let target = this.getTarget();
    if (!target) {
      return;
    }
    const step = this.moveToPointStep;
    const direction = new THREE.Vector3();
    direction.subVectors(point, target.position);
    direction.normalize();
    const newPosition = new THREE.Vector3();
    newPosition.copy(target.position);
    newPosition.add(direction.multiplyScalar(step));
    target.position.copy(newPosition);
    target.updateMatrix();
    const distance = point.distanceTo(target.position);
    if (distance > step) {
      await requestAnimationFrame(() => this.moveToPoint(point));
    }
  }

  public step2D(x: number, z: number) {
    let target = this.getTarget();
    if (!target) {
      return;
    }

    // Get the world position of the avatar.
    const position = new THREE.Vector3();
    this.target!.getWorldPosition(position);
    // Set the platform position to the avatar's position.
    if (this.target !== target) {
      target.position.copy(position);
      target.updateMatrix();
      this.target?.position.set(0, 0, 0);
      this.target?.updateMatrix();
    }

    // Get the world quaternion of the avatar.
    const quaternion = new THREE.Quaternion();
    this.target!.getWorldQuaternion(quaternion);

    // If the target is the platform (not the world), align the platform.
    if (this.target !== target) {
      target.setRotationFromQuaternion(quaternion);
      target.updateMatrix();
      // Reset the avatar's rotation relative to the platform.
      this.target?.rotation.set(0, 0, 0);
      this.target?.updateMatrix();
    }

    // Prepare to calculate new position based on the direction the avatar is facing.
    // Create a direction vector from the input (x, z) - which direction to move.
    const direction = new THREE.Vector3(x, 0, z);
    direction.applyQuaternion(quaternion); // Rotate the direction to align with avatar's facing direction.

    // Add the calculated direction to the current position to get the new position.
    const newPosition2D = target.position.clone().add(direction);

    // Move the avatar or platform to the new position.
    this.moveToPoint(newPosition2D);
  }

  public addAction(action: string, script: string) {
    (this as any)[action] = new Function('data', script).bind(this);
  }

  public async run(action: string, data: any) {
    (this as any)[action](data);
  }

  public home() {
    console.log('AvatarController::home()');
    let target = this.getTarget();
    if (!target) {
      return;
    }
    const worldPosition = new THREE.Vector3(0, 0, 0);
    this.moveToPoint(worldPosition);
  }
}
