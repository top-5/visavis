import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { EffectComposer, SSAO, Vignette } from '@react-three/postprocessing';
import Bloom from 'src/components/Bloom/Bloom.component';
import { BlendFunction } from 'postprocessing';
import { BaseModelProps, EnvironmentProps, EffectConfiguration, LightingProps } from 'src/types';

export interface AvatarEffectsProps extends LightingProps, EnvironmentProps, Omit<BaseModelProps, 'setModelFallback'> {
  shadows?: boolean;
  effects?: EffectConfiguration;
  onLoadedEffect?: (effect: EffectConfiguration) => void;
}

export const AvatarEffects: React.FC<AvatarEffectsProps> = ({ shadows = false, onLoadedEffect, effects }) => {
  return (
    <>
      {shadows && <ContactShadows position={[0, 0, 0]} opacity={2} scale={10} blur={1.0} far={1.0} />}
      {(effects?.ambientOcclusion || effects?.bloom || effects?.vignette) && (
        <EffectComposer autoClear multisampling={4} enableNormalPass={true}>
          <>
            {effects?.ambientOcclusion && (
              <SSAO
                blendFunction={BlendFunction.MULTIPLY}
                distanceScaling={false}
                radius={0.08}
                bias={0.01}
                intensity={3}
                samples={31}
                worldDistanceThreshold={24}
                worldDistanceFalloff={0}
                worldProximityThreshold={0}
                worldProximityFalloff={6}
                fade={0.02}
                rings={8}
              />
            )}
            {effects?.bloom && (
              <Bloom
                luminanceThreshold={effects?.bloom?.luminanceThreshold}
                luminanceSmoothing={effects?.bloom?.luminanceSmoothing}
                intensity={effects?.bloom?.intensity}
                kernelSize={effects?.bloom?.kernelSize}
                mipmapBlur={effects?.bloom?.mipmapBlur}
              />
            )}
            {effects?.vignette && <Vignette eskil={false} offset={0.5} darkness={0.5} />}
          </>
        </EffectComposer>
      )}
    </>
  );
};
