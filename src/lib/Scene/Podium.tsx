import React, { FC, useRef, useState } from 'react';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshReflectorMaterial, Text } from '@react-three/drei';
import { AnimationTargetUpdatedEvent, SceneEvents, useSceneEventListener } from 'src/lib/UI/SceneEvents';
// import { Physics, usePlane, useBox } from '@react-three/cannon'

// Extend Three.js geometries
extend({ PlaneBufferGeometry: THREE.PlaneGeometry });

interface PodiumProps {
  children?: React.ReactNode;
}

type TextLabels = Record<string, string>;

const defaultLabels: TextLabels = {
  bottomLeftText: '↙',
  bottomRightText: '↘',
  topLeftText: '↖',
  topRightText: '↗',
  centerLabel: 'LABEL LABEL LABEL LABEL LABEL'
};

export const Podium: FC<PodiumProps> = (props) => {
  const bottomLeftTextRef = useRef<THREE.Mesh | null>(null);
  const bottomRightTextRef = useRef<THREE.Mesh | null>(null);
  const topLeftTextRef = useRef<THREE.Mesh | null>(null);
  const topRightTextRef = useRef<THREE.Mesh | null>(null);
  const centerLabelRef = useRef<THREE.Mesh | null>(null);

  const [bottomLeftText, setBottomLeftText] = useState<string>(defaultLabels['bottomLeftText']);
  const [bottomRightText, setBottomRightText] = useState<string>(defaultLabels['bottomRightText']);
  const [topLeftText, setTopLeftText] = useState<string>(defaultLabels['topLeftText']);
  const [topRightText, setTopRightText] = useState<string>(defaultLabels['topRightText']);
  const [centerLabel, setCenterLabel] = useState<string>(defaultLabels['centerLabel']);

  useSceneEventListener(SceneEvents.AnimationTargetUpdated, (event: any) => {
    let eventData = event as AnimationTargetUpdatedEvent;
    if (eventData) {
      let clip = eventData.animation as THREE.AnimationClip;
      let time = eventData.time as number;
      // setTopRightText(`Time: ${time.toFixed(2)}`);
      // setCenterLabel(`${clip.name}`);
      // centerLabelRef.current?.updateMatrixWorld(true);

      // let textLabels = eventData.animationTarget.textLabels;
      // setBottomLeftText(textLabels["bottomLeftText"] || defaultLabels["bottomLeftText"]);
      // setBottomRightText(textLabels["bottomRightText"] || defaultLabels["bottomRightText"]);
      // setTopLeftText(textLabels["topLeftText"] || defaultLabels["topLeftText"]);
      // setTopRightText(textLabels["topRightText"] || defaultLabels["topRightText"]);
      // setCenterLabel(textLabels["centerLabel"] || defaultLabels["centerLabel"]);
    }
  });

  // const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));
  return (
    <>
      <mesh
        position={[0, 0.01, 0]} // Slightly below the avatar at the origin
        rotation={[-Math.PI / 2, 0, 0]} // Rotate to lay flat
      >
        <planeBufferGeometry attach="geometry" args={[64, 64]} />
        <MeshReflectorMaterial
          blur={[0, 0]} // Blur ground reflections (width, height), 0 skips blur
          mixBlur={0} // How much blur mixes with surface roughness (default = 1)
          mixStrength={5} // Strength of the reflections
          mixContrast={1} // Contrast of the reflections
          resolution={1024} // Off-buffer resolution, lower=faster, higher=better quality, slower
          mirror={0} // Mirror environment, 0 = texture colors, 1 = pick up env colors
          depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
          minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
          maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
          depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
          distortion={1} // Amount of distortion based on the distortionMap texture
          // distortionMap={distortionTexture} // The red channel of this texture is used as the distortion map. Default is null
          reflectorOffset={0.2} // Offsets the virtual camera that projects the reflection. Useful when the reflective surface is some distance from the object's origin (default = 0)
          transparent
          opacity={0.6}
          color="blue"
          depthWrite={true} // Material options
        />
        {props.children}
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeBufferGeometry attach="geometry" args={[64, 64]} />
        <meshBasicMaterial
          attach="material"
          color="black"
          transparent={true}
          depthWrite={false}
          colorWrite={false}
          opacity={0}
        />
        <Text ref={bottomLeftTextRef} anchorX={4} anchorY={3.8} rotation={[0, 0, 0]} fontSize={0.1} color="white">
          {bottomLeftText}
        </Text>
        <Text ref={topLeftTextRef} anchorX={4} anchorY={-4} rotation={[0, 0, 0]} fontSize={0.1} color="white">
          {topLeftText}
        </Text>
        <Text ref={bottomRightTextRef} anchorX={-3.5} anchorY={3.8} rotation={[0, 0, 0]} fontSize={0.1} color="white">
          {bottomRightText}
        </Text>
        <Text ref={topRightTextRef} anchorX={-3.5} anchorY={-4} rotation={[0, 0, 0]} fontSize={0.1} color="white">
          {topRightText}
        </Text>
        <Text ref={centerLabelRef} anchorX={4} anchorY={2} rotation={[0, 0, 0]} fontSize={0.5} color="white">
          {centerLabel}
        </Text>
      </mesh>
    </>
  );
};
