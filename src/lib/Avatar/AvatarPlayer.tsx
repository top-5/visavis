import React, { Suspense, FC, useMemo, useEffect } from 'react';
import { AnimationModel } from 'src/lib/Animation/AnimationModel.component';
import { isValidFormat, triggerCallback } from './AvatarModels.service';
import { Provider, useSetAtom } from 'jotai';
// import Capture from 'src/components/Capture/Capture.component';
import Loader from 'src/components/Loader';
import { AvatarProps } from 'src/lib/types';
import { AvatarEffects } from 'src/lib/Avatar/AvatarEffects';

// Do not accept emotion as a prop here. We will handle it in the AnimationModel component.
// Emotion and Viseme are set via AnimationModelContext instead.
export interface AvatarPlayerProps extends Omit<AvatarProps, 'emotion'> {
  actionName?: string;
  onPointerOver?: (event: any) => void;
  onPointerOut?: (event: any) => void;
}

/**
 * Basic full-body Avatar Player component ready for integration into existing scene.
 */
export const AvatarPlayer: FC<AvatarPlayerProps> = ({
  modelSrc,
  actionName = '',
  animationSrc = undefined,
  poseSrc = undefined,
  shadows = false,
  scale = 1,
  //  emotion,
  idleRotation = false,
  capture,
  onLoaded,
  onLoading,
  headMovement = false,
  onLoadedEffect,
  onLoadedAnimation,
  children,
  effects,
  onPointerOver,
  onPointerOut
}) => {
  console.log('Rendering AvatarPlayer');

  const AvatarModel = useMemo(() => {
    if (!isValidFormat(modelSrc)) {
      return null;
    }

    if (!!animationSrc && isValidFormat(animationSrc)) {
      return (
        <AnimationModel
          actionName={actionName}
          modelSrc={modelSrc}
          animationSrc={animationSrc}
          scale={scale}
          idleRotation={idleRotation}
          onLoaded={onLoaded}
          headMovement={headMovement}
          bloom={effects?.bloom}
        />
      );
    }
    console.error('No animationSrc or poseSrc was provided');
    console.error('animationSrc: ', animationSrc);
    return null;
  }, [actionName, animationSrc, modelSrc, scale, poseSrc, idleRotation, onLoaded, headMovement, effects?.bloom]);

  return (
    <>
      {AvatarModel}
      <AvatarEffects {...effects} shadows={shadows} />
      {children}
      {capture /* && <Capture {...capture} /> */}
    </>
  );
};

export const AvatarPlayerWrapper = (props: AvatarProps) => (
  <Suspense fallback={props.loader ?? <Loader />}>
    <Provider>
      <AvatarPlayer {...props} />
    </Provider>
  </Suspense>
);

export default AvatarPlayerWrapper;
