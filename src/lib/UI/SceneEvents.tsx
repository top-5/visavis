/*
MIT License

Copyright (c) 2024, Top-5

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import EventEmitter from 'events';
import { Ref, useEffect } from 'react';

export const SceneEventEmitter = new EventEmitter();
SceneEventEmitter.setMaxListeners(0);

export const SceneEvents = {
  // Object events
  ObjectCreated: 'ObjectCreated',
  ObjectUpdated: 'ObjectUpdated',
  ObjectDeleted: 'ObjectDeleted',
  // RigidBody events
  RigidBodyCreated: 'RigidBodyCreated',
  RigidBodyUpdated: 'RigidBodyUpdated',
  RigidBodyDeleted: 'RigidBodyDeleted',
  // Animation events
  AnimationStarted: 'AnimationStarted',
  AnimationPaused: 'AnimationPaused',
  AnimationStopped: 'AnimationStopped',
  AnimationTargetUpdated: 'AnimationTargetUpdated',
  AnimationCategorySelected: 'AnimationCategorySelected',
  AnimationSelected: 'AnimationSelected',
  // Camera events
  CameraReady: 'CameraReady',
  CameraMoved: 'CameraMoved',
  CameraControllerReady: 'CameraControllerReady',
  CameraControllerUpdated: 'CameraControllerUpdated',
  CameraControllerDestroyed: 'CameraControllerDestroyed',
  // Avatar events
  AvatarReady: 'AvatarReady',
  AvatarMoved: 'AvatarMoved',
  AvatarControllerReady: 'AvatarControllerReady',
  AvatarControllerUpdated: 'AvatarControllerUpdated',
  AvatarControllerDestroyed: 'AvatarControllerDestroyed',
  // Debug events
  DebugHelperToggle: 'DebugHelperToggle',
  DebugHelperShow: 'DebugHelperShow',
  DebugHelperHide: 'DebugHelpereHide',
  // Scene controls
  SceneControlsCommand: 'SceneControlsCommand',
  SceneControlsVoiceCommand: 'SceneControlsVoiceCommand',
  AnimationsVoiceCommand: 'AnimationsVoiceCommand'
};

export type AnimationTargetUpdatedEvent = Record<string, any>;

export function registerEventListener(eventName: string, callback: any) {
  SceneEventEmitter.on(eventName, callback);
}

export function unregisterEventListener(eventName: string, callback: any) {
  SceneEventEmitter.off(eventName, callback);
}

export function emit(eventName: string, data: any) {
  SceneEventEmitter.emit(eventName, data);
}

// eslint-disable-next-line react-hooks/rules-of-hooks
export function useSceneEventEmitter<T>(ref?: Ref<T>) {
  let prevRef = ref;
  useEffect(() => {
    if (!prevRef && ref) {
      emit(SceneEvents.ObjectCreated, ref);
      prevRef = ref;
    } else if (prevRef && !ref) {
      emit(SceneEvents.ObjectDeleted, prevRef);
      prevRef = ref;
    } else if (prevRef && ref) {
      emit(SceneEvents.ObjectUpdated, ref);
      prevRef = ref;
    }
  }, [ref]);
}

export type SceneEventCallback = (arg: Ref<any> | any) => void;

// eslint-disable-next-line react-hooks/rules-of-hooks
export function useSceneEventListener(eventName: string, callback: SceneEventCallback) {
  useEffect(() => {
    registerEventListener(eventName, callback);
    return () => {
      unregisterEventListener(eventName, callback);
    };
  });
}

// eslint-disable-next-line react-hooks/rules-of-hooks
export function useSceneEventsListener(eventNames: string[], callback: SceneEventCallback) {
  useEffect(() => {
    for (const eventName of eventNames) {
      registerEventListener(eventName, callback);
    }
    return () => {
      for (const eventName of eventNames) {
        unregisterEventListener(eventName, callback);
      }
    };
  }, []);
}
