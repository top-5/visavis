import { useFrame, useGraph } from '@react-three/fiber';
import React, { useMemo, useEffect, FC } from 'react';
import { AnimationMixer, Group, LoopRepeat } from 'three';
import { triggerCallback } from './AvatarModels.service';
import { loadAnimationClip } from './AvatarAnimation.service';

interface SpawnAnimationProps {
  avatar: Group;
  onLoadedAnimationFinish?: () => void;
  onLoadedAnimation: {
    src: string;
    loop?: number;
  };
}

export const AvatarSpawnAnimation: FC<SpawnAnimationProps> = ({
  avatar,
  onLoadedAnimationFinish,
  onLoadedAnimation
}) => {
  const [animationRunning, setAnimationRunning] = React.useState(true);

  useEffect(() => {
    if (!animationRunning) {
      triggerCallback(onLoadedAnimationFinish);
    }
  }, [onLoadedAnimationFinish, animationRunning]);

  const { nodes: avatarNode } = useGraph(avatar);

  const animationClip = useMemo(async () => loadAnimationClip(onLoadedAnimation?.src || ''), [onLoadedAnimation?.src]);

  const animationMixerAvatar = useMemo(async () => {
    const mixer = new AnimationMixer(avatarNode.Armature);
    if (!avatarNode.Armature) {
      return mixer;
    }

    const animation = mixer.clipAction(await animationClip);

    animation.setLoop(LoopRepeat, onLoadedAnimation?.loop || 1);
    animation.clampWhenFinished = true;

    animation.play();

    mixer.addEventListener('finished', () => {
      animation.fadeOut(0.5);
      setAnimationRunning(false);
    });

    return mixer;
  }, [avatarNode.Armature, onLoadedAnimation?.loop, animationClip]);

  useFrame(async (state, delta) => {
    (await animationMixerAvatar)?.update(delta);
  });

  return <></>;
};
