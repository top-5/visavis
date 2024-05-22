import * as THREE from 'three';
import { CameraControls } from '@react-three/drei';

const { DEG2RAD } = THREE.MathUtils;

export class CameraController {
  cameraControlsRef: React.RefObject<CameraControls>;
  defaultTarget: THREE.Object3D | null = null;

  constructor(cameraControlsRef: React.RefObject<CameraControls>) {
    console.log('Creating CameraController');
    this.cameraControlsRef = cameraControlsRef;
  }

  public setDefaultTarget(target: THREE.Object3D) {
    console.log('Setting default target to', target);
    this.defaultTarget = target;
  }

  public rotateTheta(angle: number, transition: boolean = true) {
    this.cameraControlsRef.current?.rotate(angle * DEG2RAD, 0, transition);
  }

  /**
   * Rotate the camera by +45º
   */
  public rotateTheta45() {
    this.rotateTheta(45);
  }

  /**
   * Rotate the camera by -90º
   */
  public rotateThetaNeg90() {
    this.rotateTheta(-90);
  }

  /**
   * Rotate the camera by 360º
   */
  public rotateTheta360() {
    this.rotateTheta(360);
  }

  public rotatePhi(angle: number, transition: boolean = true) {
    this.cameraControlsRef.current?.rotate(0, angle * DEG2RAD, transition);
  }

  public rotatePhi20() {
    this.rotatePhi(20);
  }

  public rotatePhiNeg40() {
    this.rotatePhi(-40);
  }

  public rotatePhi180() {
    this.rotatePhi(180);
  }

  public truck(x: number, y: number, transition: boolean = true) {
    this.cameraControlsRef.current?.truck(x, y, transition);
  }

  public dolly(distance: number, transition: boolean = true) {
    this.cameraControlsRef.current?.dolly(distance, transition);
  }

  public zoom(distance: number, transition: boolean = true) {
    this.cameraControlsRef.current?.zoom(distance, transition);
  }

  public zoomIn() {
    this.zoom(1);
  }

  public zoomOut() {
    this.zoom(-1);
  }

  public moveTo(x: number, y: number, z: number, transition: boolean = true) {
    this.cameraControlsRef.current?.moveTo(x, y, z, transition);
  }

  public setPosition(x: number, y: number, z: number, transition: boolean = true) {
    this.cameraControlsRef.current?.setPosition(x, y, z, transition);
  }

  public lookAtAvatar(
    target: THREE.Object3D | string | null = null,
    distance: number = 1,
    isFromAbove: boolean = false,
    transition: boolean = true
  ) {
    // Set the lookAt position for the camera
    if (!this.cameraControlsRef.current) {
      console.error('CameraControls not initialized');
      return;
    }
    if (!target) {
      if (this.defaultTarget) {
        target = this.defaultTarget;
      } else {
        console.log('No target specified');
        return;
      }
    }

    console.log('Looking at avatar face. Target: ', target);
    if (target instanceof THREE.Object3D) {
      const head = target.getObjectByName('Head') ?? target.getObjectByName('Neck') ?? target;
      const leftEye = head.getObjectByName('LeftEye') ?? head;
      const rightEye = head.getObjectByName('RightEye') ?? head;

      let headPosition = new THREE.Vector3();
      head.getWorldPosition(headPosition);

      let leftEyePosition = new THREE.Vector3();
      leftEye.getWorldPosition(leftEyePosition);

      let rightEyePosition = new THREE.Vector3();
      rightEye.getWorldPosition(rightEyePosition);

      // Calculate the midpoint between the eyes
      let eyeMidpoint = new THREE.Vector3().addVectors(leftEyePosition, rightEyePosition).multiplyScalar(0.5);

      // Compute a vector that points from the eyeMidpoint towards the headPosition
      // This assumes the top of the head is directly above the midpoint of the eyes
      let upDirection = new THREE.Vector3().subVectors(headPosition, eyeMidpoint).normalize();

      // Compute the normal to the plane defined by the eyes and the head
      // For this, we take the cross product of the vector from left to right eye
      // and the upDirection. This will give us a vector that points directly out from the face.
      let eyeDirection = new THREE.Vector3().subVectors(rightEyePosition, leftEyePosition).normalize();
      let faceNormal = new THREE.Vector3().crossVectors(eyeDirection, upDirection).normalize();

      // Position the camera 1 unit away from the eyeMidpoint, along the faceNormal
      let cameraPosition = new THREE.Vector3();

      if (!isFromAbove) {
        cameraPosition.addVectors(eyeMidpoint, faceNormal.multiplyScalar(distance));
        // Ensure the camera is positioned at the head height
        cameraPosition.setY(headPosition.y);
      } else {
        cameraPosition = headPosition.clone();
        cameraPosition.setY(headPosition.y + distance);
      }

      let vecFacecamPosition = cameraPosition.clone();
      let vecFacecamTarget = eyeMidpoint.clone();

      // Allow the camera to be moved even if it is locked
      let isEnabled: boolean = this.cameraControlsRef.current.enabled;
      this.cameraControlsRef.current.enabled = true;
      this.cameraControlsRef.current.setLookAt(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
        eyeMidpoint.x,
        eyeMidpoint.y,
        eyeMidpoint.z,
        true
      );

      // Restore the enabled state
      this.cameraControlsRef.current.enabled = isEnabled;
      if (!isEnabled) {
        this.cameraControlsRef.current.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z, transition);
        this.cameraControlsRef.current.update(1000);
      }
    } else {
      console.error('Target is not an Object3D');
    }
  }

  public fitToBox(target: THREE.Object3D | string | null = null, transition: boolean = true) {
    if (!target) {
      if (this.defaultTarget) {
        target = this.defaultTarget;
      } else {
        console.log('No target specified');
        return;
      }
    }
    this.cameraControlsRef.current?.fitToBox(target as THREE.Object3D, transition);
  }

  public setTarget(x: number, y: number, z: number, transition: boolean = true) {
    this.cameraControlsRef.current?.setTarget(x, y, z, transition);
  }

  public setLookAt(position: THREE.Vector3, target: THREE.Vector3, transition: boolean = true) {
    this.cameraControlsRef.current?.setLookAt(
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      transition
    );
  }

  public addAction(action: string, script: string) {
    (this as any)[action] = new Function('data', script).bind(this);
  }

  public async run(action: string, data: any) {
    (this as any)[action](data);
  }
}
