// External libraries
import React, { Ref, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Environment, StatsGl, GizmoHelper, GizmoViewcube, Sphere, DragControls, Box, Trail, Stars, useCursor } from '@react-three/drei';
import { BaseCanvas } from 'src/components/BaseCanvas';
import { prepareAnimations, downloadObjectAsJson } from 'src/prepare-animations';

// Internal libraries
import {
  AvatarPlayer,
  Draggable,
  Podium,
  Ground,
  Emotions,
  AvatarCameraControls,
  SceneEvents,
  useSceneEventListener,
  useSceneEventsListener,
  AnimationControl,
  AnimationProvider,
  BoneHelpers,
  DebugArmature,
  CameraController,
  applyViseme,
  compareEmotions,
  SceneControls,
  fetchBlob,
  Emotion,
  useAvatarControls
} from 'src/lib';

import { AnimationScript, runAnimationSequence, stopAnimationSequence } from '../lib/Animation/AnimationScript';
// import { animationSources } from './AnimationSources';
import { Perf } from 'r3f-perf';

// Styles
import styles from './App.module.scss';
import { Leva } from 'leva';
import { Physics, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { RigidBoneHelper } from 'src/lib/Avatar/BoneHelpers';
import { useAnimationControl } from 'src/lib/Animation/AnimationContext';
import { MainStage } from '../lib/Scene/MainStage';
import { CarouselItem, DoubleCarousel } from 'src/lib/UI/Carousel';
import { AnimationItem, findBestMatchForVoiceCommand } from 'src/lib/Animation/AnimationDictionary';
import { animationSources, animationCategories, loadAnimationAction } from 'src/lib/Animation/AnimationSources';
import { SceneControlsCommand } from 'src/lib/UI/SceneControls';
import { emit } from 'src/lib/UI/SceneEvents';

/**
 * Main application component.
 *
 * @returns {*}
 */
function App() {
  const animationControl: AnimationControl = useAnimationControl();
  const modelSrc = '/661796ec54c2882b31ba0ad1.glb';
  const startAnimationSrc = '/animations/F_Standing_Idle_001.fbx';
  const [emotion, setEmotion] = React.useState(Emotions.EmotionNeutral);
  const [cameraLocked, setCameraLocked] = React.useState(false);
  const armatureRef = useRef<Group | null>(null);
  const [model, setModel] = React.useState<Group | undefined>();
  const [carouselVisible, setCarouselVisible] = React.useState(false);
  const [videoItems, setVideoItems] = React.useState<any[]>([]);
  const [animations, setAnimations] = React.useState<AnimationItem[]>([]);
  const [billboardPosition, setBillboardPosition] = React.useState<Vector3>(new Vector3(0, 0, 0));
  const [dragging, setDragging] = React.useState(false);

  // animationControl.avatarController!.properties.animationSources = [];
  animationControl.avatarController!.properties = useAvatarControls(
    {
      runAnimation: () => runAnimationSequence(animationControl),
      stopAnimation: () => stopAnimationSequence(animationControl),
      animationSources: animationSources
    },
    animationControl.avatarController!.properties
  );

  console.log('Animation control: ', animationControl.avatarController!.properties);
  const {
    showHelper,
    helperAlpha,
    debugAlpha,
    fov,
    environment,
    activeViseme,
    activeEmotion,
    actionName,
    shadows,
    physicsAlpha
  } = animationControl.avatarController!.properties;
  const prevActionNameRef = useRef<string>('');

  useEffect(() => {
    const fetchAnimations = async () => {
      const animations = await prepareAnimations();
      // downloadObjectAsJson('animations', animations);
      setAnimations(animations);
      const newCarouselItems: any[] = [];
      animations.forEach((item: AnimationItem) => {
        newCarouselItems.push({ src: item.thumbnail_animated, id: item.id, name: item.name, text: item.category });
        animationSources.push(item.url!);
      });
      setVideoItems(newCarouselItems);
    };
    fetchAnimations();
  }, []);

  useEffect(() => {
    console.log('Show helper: ', showHelper);
    console.log('Helper alpha: ', helperAlpha);
    setForceShowHelper(showHelper);
  }, [showHelper, helperAlpha]);

  useMemo(() => {
    if (prevActionNameRef.current === actionName) {
      return;
    }
    loadAnimationAction(animations, actionName).then((action: string) => {
      console.log('Animation loaded: ', action);
      prevActionNameRef.current = action;
    });
  }, [animations, actionName]);

  useEffect(() => {
    console.log('Emotion changed: ', emotion);
    animationControl.setEmotion(emotion);
  }, [emotion]);

  useEffect(() => {
    if (activeViseme !== '') {
      if (applyViseme(emotion, activeViseme)) {
        setEmotion({ ...emotion });
      }
    }
  }, [activeViseme]);

  /**
   * This method is called when the active emotion changes.
   */
  useEffect(() => {
    if (activeEmotion !== '') {
      const emotionEnumValue = Emotions.EmotionKind[activeEmotion as keyof typeof Emotions.EmotionKind];
      const newEmotion: Emotion = Emotions.getEmotion(emotionEnumValue);
      console.log('ActiveEmotion: ', activeEmotion, 'Emotion enum: ', emotionEnumValue, 'Emotion: ', newEmotion);
      if (!compareEmotions(emotion, newEmotion)) {
        setEmotion(newEmotion);
      }
    }
  }, [activeEmotion]);

  useSceneEventsListener([SceneEvents.ObjectCreated, SceneEvents.ObjectUpdated], (ref: Ref<any>) => {
    const refObject = ref as RefObject<Group>;
    if (refObject && refObject.current) {
      console.log('Model object: ', refObject.current.name);
      setModel(refObject.current);
      let armature = (refObject.current.getObjectByName('Armature') ??
        refObject.current.parent?.getObjectByName('Armature')) as Group;
      armatureRef.current = armature as Group;

      animationControl.armature = armature;
    }
  });

  // Workaround to force show the debug helper since we cannot update useControls from the SceneControls component
  const [forceShowHelper, setForceShowHelper] = React.useState(false);
  useSceneEventListener(SceneEvents.DebugHelperToggle, () => {
    setForceShowHelper(!forceShowHelper);
  });

  // When CameraControls component is ready, create the CameraController
  useSceneEventListener(SceneEvents.CameraControllerReady, (cameraController: CameraController) => {
    console.log('Camera controller ready: ', cameraController);
  });

  useSceneEventListener(SceneEvents.AnimationsVoiceCommand, (voiceCommand: string) => {
    console.log('Trying to find animation for voice command: ', voiceCommand);
    const animation = findBestMatchForVoiceCommand(voiceCommand, animations);

    if (animation) {
      console.log('Found animation: ', animation);
      // If we were stopped before, then load the animation and start it
      loadAnimationAction(animations, animation.id).then((action: string) => {
        console.log('Animation loaded: ', action);
        prevActionNameRef.current = action;
        emit(SceneEvents.SceneControlsCommand, SceneControlsCommand.Play);
      });
      return;
    }

    // If animation is not found, then try to find emotion or viseme
    if (!animation) {
      const emotionEnumValue = Emotions.EmotionKind[voiceCommand as keyof typeof Emotions.EmotionKind];
      const newEmotion: Emotion = Emotions.getEmotion(emotionEnumValue);
      if (newEmotion) {
        setEmotion(newEmotion);
        return;
      }
    }
  });

  const [modelHovered, setModelHovered] = useState(false);
  useCursor(modelHovered, /*'pointer', 'auto', document.body*/);

  function onGizmoViewClick(event: ThreeEvent<MouseEvent>): null {
    try {
      console.log('Gizmo view clicked: ', event);
      // event.stopPropagation();
    } catch (error) {
      console.error('Error in onGizmoViewClick: ', error);
    }
    return null;
  }

  async function showCarousel() {
    const hipsWorldPosition = new Vector3(0, 0, 0);
    model?.getObjectByName('Hips')?.getWorldPosition(hipsWorldPosition);
    hipsWorldPosition.y += 1;
    hipsWorldPosition.z += 0.5;
    setBillboardPosition(hipsWorldPosition);
    setCarouselVisible(true);
  }

  return (
    <div className={styles.app}>
      <div className={styles.container} style={{ background: '#000000' }}>
        <SceneControls />

        <div className={styles.left_drawer} style={{ visibility: 'collapse' }}>
          <Leva
            oneLineLabels={true}
            theme={{ space: { rowGap: '0' }, fontSizes: { root: '8' } }}
            fill
            flat
            titleBar={false} />
        </div>

        <div className={styles.card}>
          <BaseCanvas position={new Vector3(0, 0, 0)} fov={fov} style={{ width: '100%', height: '100%' }}>
            {/* Environment */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Environment
              preset={environment}
              resolution={1024}
              environmentIntensity={1.5}
              backgroundIntensity={2}
              backgroundBlurriness={0.01}
              blur={0}
              background={true}
              files={[
                'synthwave-neo-3.png',
                'synthwave-neo-3.png', // Positive X, Negative X
                'night-sky-2.png',
                'floor.png', // Positive Y, Negative Y
                'synthwave-neo-3.png',
                'synthwave-neo-3.png' // Positive Z, Negative Z
              ]}
              path="/textures/" // Path to the folder containing the textures
            />
            <ambientLight intensity={0.4} />
            <Physics gravity={[0, -9.81, 0]} debug={false}>
              <AnimationProvider key="constAnimationProvider">
                <MainStage environment={environment} />

                <AvatarPlayer key="constAvatarPlayer"
                  headMovement={true}
                  idleRotation={false}
                  modelSrc={modelSrc}
                  animationSrc={startAnimationSrc}
                  shadows={shadows}
                  effects={{ ambientOcclusion: true }}
                >
                  {videoItems.length > 0 &&
                    <DoubleCarousel
                      // ref={billboardRef}
                      position={billboardPosition}
                      visible={carouselVisible}
                      onItemSelected={(id: string) => {
                        console.log('Item selected: ', id);
                        loadAnimationAction(animations, id);
                        setCarouselVisible(false);
                        setCameraLocked(false);
                      }}
                      onCanceled={() => {
                        setCarouselVisible(false);
                        setCameraLocked(false);
                      }}
                      outer={{ items: animationCategories, RX: 1.5, RY: 1.5, cx: 0, cy: 0, cz: 0, totalAngle: 3 * Math.PI / 2, animationSteps: 10, windowSize: 5, farScale: 0.2 }}
                      inner={{
                        items: videoItems, RX: 0.8, RY: 0.02, cx: 0, cy: 0.15, cz: 0.25, windowSize: 3,
                        zAngle: Math.PI / 2,
                        farScale: 0.4,
                        totalAngle: Math.PI, angleOffset: Math.PI / 2,
                        videoSize: { width: 192, height: 192 }
                      }}
                    />
                  }

                </AvatarPlayer>
                {false && <AnimationScript animationControl={animationControl} />}
                {armatureRef.current && (
                  <DebugArmature
                    armatureRef={armatureRef} key="constAnimationDebugArmature"
                    alpha={debugAlpha / 100} jointColor={0xff0000} boneColor={0x0000ff}
                    timeScale={1}
                  />
                )}
                {armatureRef.current && (
                  <BoneHelpers armatureRef={armatureRef} alpha={physicsAlpha / 100}
                    visible={forceShowHelper && showHelper} className={RigidBoneHelper}
                  />
                )}
              </AnimationProvider>
              <Draggable
                model={model}
                onDragStart={() => {setDragging(true);setCameraLocked(true)}}
                onDragEnd={() => {setCameraLocked(false);setDragging(false);}}
                onPointerEnter={() => {setModelHovered(true);console.log("Pointer enter");}}
                onPointerLeave={() => {setModelHovered(false);console.log("Pointer leave");}}
                onClick={async () => {
                  setTimeout(async () => {
                    if (!dragging && !carouselVisible) {
                      await showCarousel();
                    }
                  }, 100);
                }}
                onDoubleClick={async () => { await showCarousel(); }}
              />
              <AvatarCameraControls locked={cameraLocked} />
              <Perf />
              {false && <StatsGl />}
              <perspectiveCamera position={[0, 15, 10]} />
              {true && (
                <GizmoHelper alignment="top-left" margin={[120, 120]} renderPriority={1}>
                  <GizmoViewcube onClick={ (props) => onGizmoViewClick(props)} />
                </GizmoHelper>
              )}
            </Physics>
          </BaseCanvas>
        </div>
      </div>
    </div>
  );
}

export default App;
