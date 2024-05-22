import React, { Ref, RefObject, useEffect } from 'react';
import { useSceneEventListener, SceneEvents, useSceneEventsListener, SceneEventEmitter, emit } from './SceneEvents';
import {
  FluentProvider,
  teamsDarkTheme,
  Button,
  makeStyles,
  Popover,
  PopoverTrigger,
  PopoverSurface
} from '@fluentui/react-components';

import {
  PlayRegular,
  PauseRegular,
  StopRegular,
  RewindRegular,
  FastForwardRegular,
  MoleculeRegular,
  RecordRegular,
  VideoSwitchRegular,
  VideoPersonRegular,
  NextRegular,
  PreviousRegular,
  CubeRotateRegular,
  PersonWalkingRegular,
  PersonRunningRegular,
  PaddingLeftRegular,
  DragRegular,
  PaddingRightRegular,
  HomeRegular
} from '@fluentui/react-icons';

import { CameraController } from './CameraController';
import { AvatarController } from 'src/lib/Avatar/AvatarController';
import * as THREE from 'three';
import { AnimationControl, useAnimationControl } from 'src/lib/Animation/AnimationContext';
import type { PopoverProps } from '@fluentui/react-components';
import styles from './Visavis.module.scss';

import {
  SvgBlenderIconArmatureData,
  SvgBlenderIconBoneData,
  SvgBlenderIconConArmature,
  SvgBlenderIconOutlinerDataArmature,
  SvgBlenderIconOutlinerDataMesh,
  SvgBlenderIconPhysics,
  SvgBlenderIconView3D,
  SvgFluentMicrophoneOff,
  SvgFluentMicrophoneOn,
  SvgFluentMicrophoneSettings
} from '../../icons';

import { Toolbar, ToolbarToggleButton } from '@fluentui/react-components';
import type { ToolbarProps } from '@fluentui/react-components';
import { AudioProcessor } from 'src/lib/Audio/AudioProcessing';

export enum SceneControlsCommand {
  PlayPause = 'PlayPause',
  Play = 'Play',
  Pause = 'Pause',
  Stop = 'Stop',
  Record = 'Record',
  Previous = 'Previous',
  Rewind = 'Rewind',
  FastForward = 'FastForward',
  Next = 'Next',
  ChangeCameraView = 'ChangeCameraView',
  LookAtAvatar = 'LookAtAvatar',
  Home = 'Home',
  StepLeft = 'StepLeft',
  StepRight = 'StepRight',
  Walk = 'Walk',
  Run = 'Run',
  StartPositioning = 'StartPositioning',
  Rotate = 'Rotate',
  ToggleDebugHelper = 'ToggleDebugHelper',
  SelectCategory = 'SelectCategory',
  SelectAnimation = 'SelectAnimation',
  StartVoiceRecording = 'StartVoiceRecording',
  StopVoiceRecording = 'StopVoiceRecording'
}

const useStyles = makeStyles({
  wrapper: {
    columnGap: '15px',
    display: 'flex',
    minWidth: 'min-content'
  }
});

export const SceneControls: React.FC = () => {

  const audioProcessor: AudioProcessor = new AudioProcessor();

  const animationControl: AnimationControl = useAnimationControl();
  const [cameraController, setCameraController] = React.useState<CameraController | undefined>(undefined);
  const [avatarController, setAvatarController] = React.useState<AvatarController | undefined>(undefined);
  const [playing, setPlaying] = React.useState<boolean>(animationControl.playing);
  const [micState, setMicState] = React.useState<boolean>(true);

  let currentView = 0;
  let viewFunctions = [
    () => {
      cameraController?.lookAtAvatar(null, 1);
    }, // Face
    () => {
      cameraController?.lookAtAvatar(null, 3);
    }, // Half-Body
    () => {
      cameraController?.lookAtAvatar(null, 3); // Full Body
      cameraController?.fitToBox();
    },
    () => {
      cameraController?.lookAtAvatar(null, 5, true); // Top View
    }
  ];

  /**
   * This function handles the scene control commands.
   *
   * @param command
   */
  function handleCommand(command: SceneControlsCommand) {
    switch (command) {
      case SceneControlsCommand.PlayPause:
        console.log('Play/pause button clicked');
        if (animationControl.playing) {
          console.log('Pausing animation');
          animationControl.pause();
          setPlaying(false);
        } else {
          console.log('Playing animation');
          animationControl.play();
          setPlaying(true);
        }
        break;
      case SceneControlsCommand.Play:
        animationControl.play();
        setPlaying(true);
        break;
      case SceneControlsCommand.Pause:
        animationControl.pause();
        setPlaying(false);
        break;
      case SceneControlsCommand.Stop:
        animationControl.stop();
        setPlaying(false);
        break;
      case SceneControlsCommand.Record:
        window.alert(
          'TODO: Record animation from the scene; allow capture of video, audio, and camera view to animation.'
        );
        break;
      case SceneControlsCommand.Previous:
        animationControl.start();
        break;
      case SceneControlsCommand.Rewind:
        animationControl.step(-frameDuration);
        break;
      case SceneControlsCommand.FastForward:
        animationControl.step(+frameDuration);
        break;
      case SceneControlsCommand.Next:
        animationControl.end();
        break;
      case SceneControlsCommand.ChangeCameraView:
        viewFunctions[currentView++]();
        currentView = currentView % viewFunctions.length;
        break;
      case SceneControlsCommand.LookAtAvatar:
        cameraController?.lookAtAvatar(null, 1);
        break;
      case SceneControlsCommand.Home:
        avatarController?.home();
        break;
      case SceneControlsCommand.StepLeft:
        stepRight();
        break;
      case SceneControlsCommand.StepRight:
        stepLeft();
        break;
      case SceneControlsCommand.StartPositioning:
        cameraController?.lookAtAvatar(null, 5, true, true);
        break;
      case SceneControlsCommand.Walk:
        // avatarController?.walk();
        break;
      case SceneControlsCommand.Run:
        // avatarController?.run();
        break;
      case SceneControlsCommand.Rotate:
        cameraController?.rotateThetaNeg90();
        break;
      case SceneControlsCommand.ToggleDebugHelper:
        toggleDebugHelper();
        break;
      default:
        console.error('Unknown command: ', command);
        break;
    }
  }

  // When CameraControls component is ready, create the CameraController
  useSceneEventListener(SceneEvents.CameraControllerReady, (cameraController: CameraController) => {
    console.log('Camera controller ready: ', cameraController);
    setCameraController(cameraController);
  });

  // When AvatarController component is ready, create the AvatarController
  useSceneEventsListener([SceneEvents.ObjectCreated, SceneEvents.ObjectUpdated], (ref: Ref<any>) => {
    const refObject = ref as RefObject<THREE.Group>;
    if (refObject && refObject.current) {
      console.log('Model object: ', refObject.current.name);
      const armature = refObject.current.getObjectByName('Armature');
      if (!armature) {
        window.alert('No armature found in the model.');
        return;
      }
      animationControl.avatarController = new AvatarController();
      animationControl.avatarController.setTarget(armature!);
      animationControl.avatarController.setAnimationControl(animationControl);
      SceneEventEmitter.emit(SceneEvents.AvatarControllerReady, animationControl.avatarController);
    }
  });

  useSceneEventListener(SceneEvents.AvatarControllerReady, (avatarController: AvatarController) => {
    console.log('Avatar controller ready: ', avatarController);
    setAvatarController(avatarController);
    setPlaying(animationControl.playing);
  });

  useSceneEventsListener([SceneEvents.AnimationPaused, SceneEvents.AnimationStopped], () => {
    console.log('Animation stopped/paused');
    setPlaying(false);
  });

  useSceneEventListener(SceneEvents.AnimationStarted, () => {
    console.log('Animation started/resumed');
    setPlaying(true);
  });

  useSceneEventListener(SceneEvents.SceneControlsCommand, (command: SceneControlsCommand) => {
    console.log('Received command: ', command);
    handleCommand(command);
  });

  // TODO: only English commands are supported for now
  const handleVoiceCommand = (voiceCommand: string) => {
    voiceCommand = voiceCommand.toLowerCase().trim();
    switch (voiceCommand) {
      case 'go':
      case 'play':
        handleCommand(SceneControlsCommand.Play);
        break;
      case 'pause':
        handleCommand(SceneControlsCommand.Pause);
        break;
      case 'freeze':
      case 'stop':
        handleCommand(SceneControlsCommand.Stop);
        break;
      case 'record':
        handleCommand(SceneControlsCommand.Record);
        break;
      case 'previous':
        handleCommand(SceneControlsCommand.Previous);
        break;
      case 'rewind':
        handleCommand(SceneControlsCommand.Rewind);
        break;
      case 'fast forward':
        handleCommand(SceneControlsCommand.FastForward);
        break;
      case 'next':
        handleCommand(SceneControlsCommand.Next);
        break;

      case 'change camera':
      case 'toggle camera':
      case 'change view':
      case 'change camera view':
        handleCommand(SceneControlsCommand.ChangeCameraView);
        break;
      case 'portrait':
      case 'face view':
      case 'look at avatar':
        handleCommand(SceneControlsCommand.LookAtAvatar);
        break;
      case 'home':
        handleCommand(SceneControlsCommand.Home);
        break;
      case 'step left':
        handleCommand(SceneControlsCommand.StepLeft);
        break;
      case 'step right':
        handleCommand(SceneControlsCommand.StepRight);
        break;
      case 'above':
      case 'look from above':
      case 'above view':
      case 'start positioning':
        handleCommand(SceneControlsCommand.StartPositioning);
        break;

/*
      case 'walk':
        handleCommand(SceneControlsCommand.Walk);
        break;
      case 'run':
        handleCommand(SceneControlsCommand.Run);
        break;
*/

      case 'rotate':
        handleCommand(SceneControlsCommand.Rotate);
        break;
      default:
        emit(SceneEvents.AnimationsVoiceCommand, voiceCommand);
        // console.error('Unknown voice command: ', voiceCommand);
        break;
    }
  };

  useSceneEventListener(SceneEvents.SceneControlsVoiceCommand, (voiceCommand: string) => {
    console.log('Received voice command: ', voiceCommand);
    handleVoiceCommand(voiceCommand);
  });

  function toggleDebugHelper() {
    // let showHelper: boolean = animationControl.avatarController!.properties.showHelper;
    // showHelper = !showHelper;
    // animationControl.avatarController!.properties.showHelper = showHelper;
    // Emit the event to show/hide the debug helper
    // This is somewhat cringe-worthy, but it works.
    const showHelperCb = document.getElementById('Debug Armature.showHelper') as HTMLInputElement;
    if (showHelperCb) {
      // Dispatch state change event to the checkbox
      showHelperCb.checked = !showHelperCb.checked;
      showHelperCb.dispatchEvent(new Event('change', { bubbles: true }));
      // showHelperCb.dispatchEvent(new Event('input', { bubbles: true }));
    }
    SceneEventEmitter.emit(SceneEvents.DebugHelperToggle);
  }

  function getNaturalDirection(): number {
    // Camera azimuth angle in radians, convert to degrees for consistency
    let cameraDirection = cameraController?.cameraControlsRef.current?.azimuthAngle ?? 0;
    cameraDirection = THREE.MathUtils.radToDeg(cameraDirection);

    // Normalize the camera direction to range [0, 360]
    cameraDirection = (cameraDirection + 360) % 360;

    // Avatar direction in radians, convert to degrees
    let worldRotation = avatarController?.target!.rotation.clone() ?? new THREE.Euler();
    worldRotation.reorder('YXZ');
    let avatarDirection = worldRotation.y;
    // let avatarDirection = avatarController?.target!.rotation.y ?? 0;
    avatarDirection = THREE.MathUtils.radToDeg(avatarDirection);

    // Normalize the avatar direction to range [0, 360]
    avatarDirection = (avatarDirection + 360) % 360;

    // Compute natural direction as the difference
    let naturalDirection = avatarDirection - cameraDirection;

    // Normalize natural direction to range [-180, 180]
    if (naturalDirection > 180) {
      naturalDirection -= 360;
    } else if (naturalDirection < -180) {
      naturalDirection += 360;
    }

    return naturalDirection;
  }

  function stepLeft() {
    let naturalDirection = getNaturalDirection();
    let step = 1;
    if (naturalDirection < -90 || naturalDirection > 90) {
      step = -1;
    }
    avatarController?.step2D(step, 0);
  }

  function stepRight() {
    let naturalDirection = getNaturalDirection();
    let step = 1;
    if (naturalDirection < -90 || naturalDirection > 90) {
      step = -1;
    }
    avatarController?.step2D(-step, 0);
  }

  const frameDuration = 1 / 30;

  /*
                <Button shape="square" icon={<MoleculeRegular />} onClick={() => toggleDebugHelper() } />
                <Button shape="square" icon={<GameIconsSkeletonInside/>} />
    */

  const ArmatureSettingsToolbar = (props: Partial<ToolbarProps>) => (
    <Toolbar
      vertical
      {...props}
      aria-label="Vertical"
      style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 }}
    >
      <ToolbarToggleButton name="Show bones" value="bones" aria-label="bones" icon={<MoleculeRegular />} />
      <ToolbarToggleButton
        name="Show meshes"
        value="meshes"
        aria-label="meshes"
        icon={<SvgBlenderIconArmatureData />}
      />
      <ToolbarToggleButton name="Show bones" value="bonesx" aria-label="bones" icon={<SvgBlenderIconBoneData />} />
      <ToolbarToggleButton
        name="Show meshes"
        value="meshes2"
        aria-label="meshes"
        icon={<SvgBlenderIconConArmature />}
      />
      <ToolbarToggleButton
        name="Show meshes"
        value="meshes3"
        aria-label="meshes"
        icon={<SvgBlenderIconOutlinerDataArmature />}
      />
      <ToolbarToggleButton
        name="Show meshes"
        value="meshes4"
        aria-label="meshes"
        icon={<SvgBlenderIconOutlinerDataMesh />}
      />
      <ToolbarToggleButton name="Show meshes" value="meshes4" aria-label="meshes" icon={<SvgBlenderIconPhysics />} />
    </Toolbar>
  );

  const ArmatureSettings: React.FC<PopoverProps> = (props: PopoverProps) => (
    <Popover {...props}>
      <PopoverTrigger disableButtonEnhancement>
        <Button shape="square" icon={<SvgBlenderIconView3D />} />
      </PopoverTrigger>
      <PopoverSurface
        tabIndex={-1}
        className={styles.frameless}
        style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 }}
      >
        <ArmatureSettingsToolbar />
      </PopoverSurface>
    </Popover>
  );

  function startRecording() {
    setMicState(true);
    setTimeout(async () => 
    {
      await audioProcessor.listenToMicrophone();
    }, 50);
  }

  function stopRecording() {
    setMicState(false);
    audioProcessor.stopSpeechRecognition();
  }

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const MicSettingsToolbar = (props: Partial<ToolbarProps>) => (
    <Toolbar
      vertical
      {...props}
      aria-label="Vertical"
      style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 }}
    >
      <ToolbarToggleButton name="Turn mic on" value="micOn" icon={<SvgFluentMicrophoneOn />} onClick={() => startRecording()} />
      <ToolbarToggleButton name="Turn mic off" value="micOn" icon={<SvgFluentMicrophoneOff />} onClick={() => stopRecording()} />
      <ToolbarToggleButton name="Turn mic settings" value="micSettings" icon={<SvgFluentMicrophoneSettings />} />
    </Toolbar>
  );

  const MicSettings: React.FC<PopoverProps> = (props: PopoverProps) => (
    <Popover {...props}>
      <PopoverTrigger disableButtonEnhancement>
        <Button shape="square" icon={(micState) ? <SvgFluentMicrophoneOn /> : <SvgFluentMicrophoneOff />} />
      </PopoverTrigger>
      <PopoverSurface
        tabIndex={-1}
        className={styles.frameless}
        style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 }}
      >
        <MicSettingsToolbar />
      </PopoverSurface>
    </Popover>
  );

  return (
    <FluentProvider theme={teamsDarkTheme}>
      <div className={styles.bottom_drawer}>
        <div className={styles.wrapper}>
          {cameraController && (
            <div className={styles.center}>
              {!playing && (
                <Button
                  key={Math.random()}
                  shape="square"
                  icon={<PlayRegular />}
                  onClick={(evt) => handleCommand(SceneControlsCommand.PlayPause)}
                />
              )}
              {playing && (
                <Button
                  key={Math.random()}
                  shape="square"
                  icon={<PauseRegular />}
                  onClick={(evt) => handleCommand(SceneControlsCommand.PlayPause)}
                />
              )}
              <Button
                shape="square"
                icon={<StopRegular />}
                onClick={(evt) => handleCommand(SceneControlsCommand.Stop)}
                appearance={playing ? 'primary' : 'secondary'}
              />
              &nbsp; &nbsp;
              <Button
                shape="square"
                icon={<RecordRegular />}
                onClick={() => handleCommand(SceneControlsCommand.Record)}
                appearance="subtle"
              />
              &nbsp; &nbsp;
              <Button
                shape="square"
                icon={<PreviousRegular />}
                onClick={() => handleCommand(SceneControlsCommand.Previous)}
              />
              <Button
                shape="square"
                icon={<RewindRegular />}
                onClick={() => handleCommand(SceneControlsCommand.Rewind)}
              />
              <Button
                shape="square"
                icon={<FastForwardRegular />}
                onClick={() => handleCommand(SceneControlsCommand.FastForward)}
              />
              <Button shape="square" icon={<NextRegular />} onClick={() => handleCommand(SceneControlsCommand.Next)} />
              &nbsp; &nbsp;
              <Button
                shape="square"
                icon={<VideoSwitchRegular />}
                onClick={() => handleCommand(SceneControlsCommand.ChangeCameraView)}
              />
              &nbsp;
              <Button
                shape="square"
                icon={<VideoPersonRegular />}
                onClick={() => handleCommand(SceneControlsCommand.LookAtAvatar)}
              />
              &nbsp; &nbsp;
              <Button shape="square" icon={<HomeRegular />} onClick={() => handleCommand(SceneControlsCommand.Home)} />
              <Button
                shape="square"
                icon={<PersonWalkingRegular />}
                onClick={() => handleCommand(SceneControlsCommand.Walk)}
              />
              <Button
                shape="square"
                icon={<PersonRunningRegular />}
                onClick={() => handleCommand(SceneControlsCommand.Run)}
              />
              &nbsp; &nbsp;
              <Button
                shape="square"
                icon={<PaddingLeftRegular />}
                onClick={() => handleCommand(SceneControlsCommand.StepLeft)}
              />
              <Button
                shape="square"
                icon={<DragRegular />}
                onClick={() => handleCommand(SceneControlsCommand.StartPositioning)}
              />
              <Button
                shape="square"
                icon={<PaddingRightRegular />}
                onClick={() => handleCommand(SceneControlsCommand.StepRight)}
              />
              &nbsp;
              <Button
                shape="square"
                icon={<CubeRotateRegular onClick={() => handleCommand(SceneControlsCommand.Rotate)} />}
              />
              &nbsp;
              <ArmatureSettings size={'small'}>
                <div />
              </ArmatureSettings>

              <MicSettings size={'small'}>
                <div />
              </MicSettings>

            </div>
          )}
        </div>
      </div>
    </FluentProvider>
  );
};
