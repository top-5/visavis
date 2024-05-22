import * as THREE from 'three';
import React, { memo, useRef, useEffect, useState, RefObject, useContext, Suspense, Ref } from 'react';
import { useThree } from '@react-three/fiber';
import { AccumulativeShadows, RandomizedLight, CameraControls } from '@react-three/drei';
import { useControls, button, buttonGroup, folder } from 'leva';
import { CameraController } from 'src/lib/UI/CameraController';
import { SceneEventEmitter, SceneEvents, emit, useSceneEventListener, useSceneEventsListener } from 'src/lib/UI/SceneEvents';
import { AnimationControl, AnimationControlContext, useAnimationControl } from 'src/lib/Animation/AnimationContext';

const { DEG2RAD } = THREE.MathUtils;

interface AvatarCameraControlsProps {
  //    armature: RefObject<THREE.Group | null>;
  //    controls: RefObject<CameraControls>;
  locked?: boolean;
}

type Vect3 = [number, number, number];

const LevaControls: React.FC<{ controller: CameraController; controls: CameraControls }> = ({
  controller,
  controls
}) => {
  const { scene, camera } = useThree();

  useControls(
    {
      thetaGrp: buttonGroup({
        label: 'rotate theta',
        opts: {
          '+45º': () => controller?.rotateTheta45(),
          '-90º': () => controller?.rotateThetaNeg90(),
          '+360º': () => controller?.rotateTheta360()
        }
      }),
      phiGrp: buttonGroup({
        label: 'rotate phi',
        opts: {
          '+20º': () => controller?.rotatePhi20(),
          '-40º': () => controller?.rotatePhiNeg40()
        }
      }),
      truckGrp: buttonGroup({
        label: 'truck',
        opts: {
          '(1,0)': () => controller?.truck(1, 0),
          '(0,1)': () => controller?.truck(0, 1),
          '(-1,-1)': () => controller?.truck(-1, -1)
        }
      }),
      dollyGrp: buttonGroup({
        label: 'dolly',
        opts: {
          '1': () => controller?.dolly(1),
          '-1': () => controller?.dolly(-1)
        }
      }),
      zoomGrp: buttonGroup({
        label: 'zoom',
        opts: {
          '/2': () => controller?.zoom(camera.zoom / 2),
          '/-2': () => controller?.zoom(-camera.zoom / 2)
        }
      }),
      minDistance: {
        value: 2,
        set: (val: number) => {
          controls.minDistance = val;
        },
        get: (val: number) => {
          return controls.minDistance;
        }
      },
      moveTo: folder(
        {
          vec1: { value: [3, 5, 2], label: 'vec' },
          'moveTo(…vec)': button((get) => controller?.moveTo(...(get('moveTo.vec1') as Vect3)))
        },
        { collapsed: true }
      ),
      setPosition: folder(
        {
          vec2: { value: [-5, 2, 1], label: 'vec' },
          'setPosition(…vec)': button((get) => controller?.setPosition(...(get('setPosition.vec2') as Vect3)))
        },
        { collapsed: true }
      ),
      setTargetAvatar: folder(
        {
          Face: button((get) => controller?.lookAtAvatar(null, 1)),
          'Half-Body': button((get) => controller?.lookAtAvatar(null, 3)),
          'Full Body': button(() => controller?.fitToBox()),
          'Top View': button((get) => controller?.lookAtAvatar(null, 5, true))
        },
        {
          collapsed: false
        }
      ),
      setTarget: folder(
        {
          vec3: { value: [3, 0, -3], label: 'vec' },
          'setTarget(…vec)': button((get) => controller?.setTarget(...(get('setTarget.vec3') as Vect3), true))
        },
        { collapsed: true }
      ),
      setLookAt: folder(
        {
          vec4: { value: [1, 2, 3], label: 'position' },
          vec5: { value: [1, 1, 0], label: 'target' },
          'setLookAt(…position, …target)': button((get) => {
            let vec4 = get('setLookAt.vec4') as Vect3;
            let vec5 = get('setLookAt.vec5') as Vect3;
            controller?.setLookAt(
              new THREE.Vector3(vec4[0], vec4[1], vec4[2]),
              new THREE.Vector3(vec5[0], vec5[1], vec5[2])
            );
          })
        },
        {
          collapsed: true
        }
      ),
      /*
                // TODO: lerpLookAt is not implemented in CameraController yet
                lerpLookAt: folder(
                    {
                        vec6: { value: [-2, 0, 0], label: 'posA' },
                        vec7: { value: [1, 1, 0], label: 'tgtA' },
                        vec8: { value: [0, 2, 5], label: 'posB' },
                        vec9: { value: [-1, 0, 0], label: 'tgtB' },
                        t: { value: Math.random(), label: 't', min: 0, max: 1 },
                        'f(…posA,…tgtA,…posB,…tgtB,t)': button((get) => cameraControlsRef.current?.lerpLookAt(
                            ...get('lerpLookAt.vec6') as Vect3,
                            ...get('lerpLookAt.vec7') as Vect3,
                            ...get('lerpLookAt.vec8') as Vect3,
                            ...get('lerpLookAt.vec9') as Vect3,
                            get('lerpLookAt.t'),
                            true
                        )
                        )
                    },
                    { collapsed: true }
                ),
                saveState: button(() => cameraControlsRef.current?.saveState()),
                reset: button(() => cameraControlsRef.current?.reset(true)),
        */
      enabled: {
        value: true,
        label: 'controls on',
        set: (val: boolean) => {
          controls.enabled = val;
        },
        get: (val: boolean) => {
          return controls.enabled;
        }
      },
      verticalDragToForward: {
        value: false,
        label: 'vert. drag to move forward',
        set: (val: boolean) => {
          controls.verticalDragToForward = val;
        },
        get: (val: boolean) => {
          return controls.verticalDragToForward;
        }
      },
      dollyToCursor: {
        value: false,
        label: 'dolly to cursor',
        set: (val: boolean) => {
          controls.dollyToCursor = val;
        },
        get: (val: boolean) => {
          return controls.dollyToCursor;
        }
      },
      infinityDolly: {
        value: false,
        label: 'infinity dolly',
        set: (val: boolean) => {
          controls.infinityDolly = val;
        },
        get: (val: boolean) => {
          return controls.infinityDolly;
        }
      }
    },
    { collapsed: true }
  );

  return null;
};

export const AvatarCameraControls: React.FunctionComponent<AvatarCameraControlsProps> = ({ ...props }) => {
  const animationControl: AnimationControl = useContext(AnimationControlContext);
  const [locked, setLocked] = useState<boolean>(props.locked ?? false);
  const controls = useRef<CameraControls>(null);

  useEffect(() => {
    console.log('AvatarCameraControls props changed');
    setLocked(props.locked ?? false);
  }, [props]);

  useEffect(() => {
    if (controls.current) {
      console.log('Camera Controls are now available');
      if (!animationControl.cameraController) {
        console.log('Creating CameraController');
        animationControl.cameraController = new CameraController(controls);

        // Notify SceneControls that the CameraController is ready
        emit(SceneEvents.CameraControllerReady, animationControl.cameraController);
        animationControl.cameraController.setLookAt(new THREE.Vector3(0, 5, 5), new THREE.Vector3(0, 0, 0));
        animationControl.cameraController.fitToBox();
        if (animationControl.armature) {
          animationControl.cameraController?.setDefaultTarget(animationControl.armature);
          animationControl.cameraController?.lookAtAvatar(null, 3);
        }
      }
    }
  }, [controls.current]); // This ensures the effect runs only when controls.current changes

  return (
    <>
      <CameraControls ref={controls} {...props} enabled={!locked} />
      {controls.current && <LevaControls controller={animationControl.cameraController!} controls={controls.current} />}
    </>
  );
};
