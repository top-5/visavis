import React, { MutableRefObject, Ref, RefObject, createRef, useContext, useEffect, useRef, useState } from 'react';
import { Vector2, Vector3 } from 'three';
import { useGraph, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, DragControls, Outlines, Sparkles } from '@react-three/drei';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { findTopParent } from '../utils';
import { AnimationControl, AnimationControlContext, useAnimationControl } from 'src/lib/Animation/AnimationContext';
import { SceneEvents, useSceneEventListener } from 'src/lib/UI/SceneEvents';

export const AvatarDragControls: MutableRefObject<THREE.Group | null> = React.createRef();

export interface DraggableProps {
  model: THREE.Group | undefined;
  onSelected?: () => void;
  onUnselected?: () => void;
  onPointerEnter?: (pointer: Vector2) => void;
  onPointerLeave?: (pointer: Vector2) => void;
  onPointerMove?: (pointer: Vector2) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDoubleClick?: () => void;
  onClick?: () => void;
}

/// This component allows to drag its target component around the scene.
export const Draggable: React.FC<DraggableProps> = ({ onSelected, onUnselected, ...props }) => {
  const animationControl: AnimationControl = useAnimationControl();
  const [target, setTarget] = useState<THREE.Group | undefined>(props.model);
  const rigidBody = useRef<RapierRigidBody | null>(null);
  const oldPosition = useRef<Vector3>(new Vector3(0, 0, 0));

  useEffect(() => {
    if (props.model && props.model !== target) {
      let target = props.model.getObjectByName('Armature') ?? props.model;
      setTarget(target as THREE.Group);
    }
  }, [props.model]);

  useSceneEventListener(SceneEvents.RigidBodyCreated, (rigidBodyRef: RefObject<RapierRigidBody>) => {
    if (rigidBodyRef.current instanceof RapierRigidBody) {
      rigidBody.current = rigidBodyRef.current;
    }
  });

  const { camera, scene, pointer, raycaster } = useThree();

  const dragRef = useRef<THREE.Group>(null);
  const [selected, setSelected] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(false);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  let prevPointer: THREE.Vector2 = new THREE.Vector2();
  let lastHoverState: boolean = selected;

  // Notify the parent component when the target is being dragged
  let isDragging: boolean = false;

  const lookAtCamera = () => {
    const worldPos = new THREE.Vector3();
    if (camera && target) {
      target!.getWorldPosition(worldPos);
      // Create a new position vector for the camera that is at the same vertical level as the model
      const cameraPosition: THREE.Vector3 = new THREE.Vector3(camera.position.x, worldPos.y, camera.position.z);
      target.lookAt(cameraPosition);
    }
  };

  useEffect(() => {
    if (selected) {
      // console.log("Pointer enter:", pointer);
      if (!target || !dragRef.current) return;
      alignWithTarget();
      props.onPointerEnter?.(pointer);
      onSelected?.();
    } else {
      // console.log("Pointer leave:", pointer);
      props.onPointerLeave?.(pointer);
      onUnselected?.();
    }
  }, [selected]);

  useEffect(() => {
    if (target && dragRef.current) {
      AvatarDragControls.current = dragRef.current;
      // lookAtCamera();
    }
  }, [target, dragRef.current]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (target) {
        if (!target.visible) {
          return;
        }
        raycaster.setFromCamera(pointer, camera);
        let intersects = raycaster.intersectObject(target, true);
        if (selected && dragRef.current && intersects.length === 0) {
          // If the target is selected and the pointer is not hovering
          // over the target, but still intersects the Float and its
          // children, then keep the target selected.
          // intersects = raycaster.intersectObject(dragRef.current, true);
        }
        const isHover = intersects.length > 0;
        if (isHover) {
          if (spotLightRef.current) {
            spotLightRef.current.target = target;
            // Direct spot light to the point where the pointer is hovering
            // spotLightRef.current?.target.position.copy(intersects[0].point);
          }
          if (prevPointer.x !== pointer.x || prevPointer.y !== pointer.y) {
            // console.log("Pointer move:", pointer);
            props.onPointerMove?.(pointer);
          }
        }
        if (isHover !== lastHoverState) {
          // Selected state is being updated asynchonously
          setSelected(isHover);
          lastHoverState = isHover;
        }
        prevPointer = pointer.clone();
      }
    }, 100);
    return () => clearInterval(interval); // Cleanup the interval when the component unmounts
  }, [target]);

  function alignWithDrag() {
    let drag = dragRef.current!;
    drag.updateMatrix();
    animationControl.avatarController?.moveToPoint(drag.position);
    // lookAtCamera();
  }

  function alignWithTarget() {
    let drag = dragRef.current!;
    if (target) {
      // Target is a starting point in the animation sequence.
      // Best to align the drag object with the Hips bone.
      const worldPos = new THREE.Vector3();
      const hips = target.getObjectByName('Hips');
      (hips ?? target).getWorldPosition(worldPos);
      worldPos.y = 0;
      drag.position.copy(worldPos);
      drag.updateMatrix();
    }
  }

  const onDrag = (
    localMatrix: THREE.Matrix4,
    deltaLocalMatrix: THREE.Matrix4,
    worldMatrix: THREE.Matrix4,
    deltaWorldMatrix: THREE.Matrix4
  ) => {
    // let drag = dragRef.current!;
    // drag.applyMatrix4(deltaWorldMatrix);
    // alignWithDrag();
  };

  const onDragStart = (origin: Vector3) => {
    console.log('Drag start');
    if (!highlighted) {
      setHighlighted(true);
    }
    oldPosition.current.copy(target!.position);
    let drag = dragRef.current!;
    drag.add(target!);
    target!.position.set(0, 0, 0);
    const hips = target!.getObjectByName('Hips');
    if (hips) {
      hips.position.set(0, hips.position.y, 0);
    }
    // lookAtCamera();
    props?.onDragStart?.();
  };

  const onDragEnd = () => {
    console.log('Drag end');
    setHighlighted(false);
    let drag = dragRef.current!;
    let targetParent = scene.getObjectByName('model'); // or avatarBody
    if (targetParent) {
      let dragWorld = new THREE.Vector3();
      drag.getWorldPosition(dragWorld);

      targetParent.position.copy(dragWorld);
      targetParent.rotation.copy(drag.rotation);
      targetParent.updateMatrix();

      targetParent.add(target!);
      target!.updateMatrix();
    }
    props?.onDragEnd?.();
  };

  return (
    <>
      <spotLight
        ref={spotLightRef}
        position={[0, 3, 0]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        castShadow={true}
        visible={selected} />

      <DragControls
        ref={dragRef}
        autoTransform={true}
        dragLimits={[
          [-16, 16],
          [0, 0],
          [-16, 16]
        ]}
        onDrag={onDrag}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <Float
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          floatIntensity={0.2}
          rotationIntensity={0.2}
          castShadow={true}
          receiveShadow={true}
          onClick={() => { props.onClick?.(); }}
          onDoubleClick={() => { props.onDoubleClick?.(); }}
        >
          <mesh position={[0, 0, 0]} castShadow={true} receiveShadow={true} visible={selected}>
            <cylinderGeometry args={[0.5, 0.5, 0.005, 32]} />
            <meshLambertMaterial transparent={true} opacity={highlighted ? 0.5 : 0.1} color="green" />
            <Outlines thickness={0.001} color="green" opacity={highlighted ? 0.5 : 0.1} />
            <Sparkles count={100} />
          </mesh>
          <mesh position={[0, 5, 0]} castShadow={true} receiveShadow={false} visible={highlighted}>
            <cylinderGeometry args={[0.5, 0.5, 10, 32]} />
            <meshStandardMaterial opacity={0.25} transparent={true} depthTest={false} />
          </mesh>
        </Float>
      </DragControls>
    </>
  );
};
