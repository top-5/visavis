import { useAtomValue } from 'jotai/index';
import React, { FC, useEffect } from 'react';
import { Group } from 'three';
import { AvatarSpawnEffect } from './AvatarSpawnEffect.component';
import { AvatarSpawnAnimation } from './AvatarSpawnAnimation.component';
import { isValidFormat, triggerCallback } from './AvatarModels.service';
import { spawnState } from 'src/state/spawnAtom';

interface SpawnProps {
  avatar: Group;
  onSpawnFinish?: () => void;
}
export const AvatarSpawn: FC<SpawnProps> = ({ avatar, onSpawnFinish }) => {
  const animationProps = useAtomValue(spawnState);

  const usesMountEffect = isValidFormat(animationProps?.onLoadedEffect?.src);
  const usesMountAnimation = isValidFormat(animationProps?.onLoadedAnimation?.src);

  const [effectRunning, setEffectRunning] = React.useState(usesMountEffect);
  const [animationRunning, setAnimationRunning] = React.useState(usesMountAnimation);

  useEffect(() => {
    if (!animationRunning && !effectRunning) {
      triggerCallback(onSpawnFinish);
    }
  }, [onSpawnFinish, effectRunning, animationRunning]);

  const onLoadedAnimationFinish = () => {
    console.warn('AvatarSpawn::onLoadedAnimationFinish: avatar uuid=', avatar.uuid);
    setAnimationRunning(false);
  };

  const onLoadedEffectFinish = () => {
    setEffectRunning(false);
  };

  return (
    <>
      {usesMountEffect && (
        <AvatarSpawnEffect
          onLoadedEffect={animationProps.onLoadedEffect as { src: string; animationSrc?: string; loop?: number }}
          onLoadedEffectFinish={onLoadedEffectFinish}
        />
      )}
      {usesMountAnimation && (
        <AvatarSpawnAnimation
          onLoadedAnimation={animationProps.onLoadedAnimation as { src: string; loop?: number }}
          avatar={avatar}
          onLoadedAnimationFinish={onLoadedAnimationFinish}
        />
      )}
    </>
  );
};
