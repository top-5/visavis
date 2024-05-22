import React, { useState, useRef } from 'react';
import { Canvas, Vector3, useFrame, useThree } from '@react-three/fiber';
import { Box, Plane, Text, ShapeProps, MeshReflectorMaterial, RoundedBox, Svg, useTexture } from '@react-three/drei';
import { BoxGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Texture } from 'three';
import { MeshReflectorMaterialProps } from '@react-three/drei/materials/MeshReflectorMaterial';
import { getTextureFromCanvas } from './EmojiMesh';
import { ColorEffect } from './ColorEffects';

interface MaterialProps {
    backgroundColor?: string;
    textColor?: string;
    resolution?: number;
    mixBlur?: number;
    mixStrength?: number;
    blur?: [number, number] | number;
    minDepthThreshold?: number;
    maxDepthThreshold?: number;
    depthScale?: number;
    depthToBlurRatioBias?: number;
    distortionMap?: Texture;
    distortion?: number;
    mixContrast?: number;
    reflectorOffset?: number;
}

interface Button3DProps extends ShapeProps<typeof PlaneGeometry> {
    position?: Vector3;
    text?: string;
    backgroundColor?: string;
    textColor?: string;
    hoverColor?: string;
    onClick: () => void;
    icon?: {
        src: string;
        width?: number;
        height?: number;
        filter?: ColorEffect;
        opacity?: number;
    };
    onPointerOver?: (event: any) => void;
    onPointerOut?: (event: any) => void;
    children?: React.ReactNode[];
}

export const MirrorMaterial: React.FC<MaterialProps> = (props) => {
    return (
        <MeshReflectorMaterial
            {...props}
            color={props.backgroundColor}
            transparent={true}
            opacity={1}
            blur={[1, 1]} // Blur ground reflections (width, height), 0 skips blur
            mixBlur={1} // How much blur mixes with surface roughness (default = 1)
            mixStrength={1} // Strength of the reflections
            mixContrast={1} // Contrast of the reflections
            resolution={256} // Off-buffer resolution, lower=faster, higher=better quality, slower
            mirror={1} // Mirror environment, 0 = texture colors, 1 = pick up env colors
            depthScale={0} // Scale the depth factor (0 = no depth, default = 0)x`
            minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
            maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
            depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
            distortion={1} // Amount of distortion based on the distortionMap texture
            reflectorOffset={0.2} // Offsets the virtual camera that projects the reflection. Useful when the reflective surface is some distance from the object's origin (default = 0)
        />
    )
};

function isEmoji(str: string): boolean {
    const emojiRegex = /(\p{Emoji}|\p{Emoji_Component}|\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    const result: boolean = emojiRegex.test(str);
    return result;
}

export const Button3D: React.FC<Button3DProps> = ({ position, text, onClick, children, hoverColor, ...props }) => {
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);
    const meshRef = useRef<Mesh>(null);

    const iconWidth: number = props.icon?.width || 128;
    const iconHeight: number = props.icon?.height || 128;

    function EmojiIcon() {
        const texture = getTextureFromCanvas(props.icon?.src!, iconWidth, iconHeight, props.icon?.filter ?? 'none');
        return (
            <Plane
                castShadow receiveShadow
                scale={[1, 1, 1]}
                args={[0.3, 0.3]} position={[0, 0, 0]}>
                <meshBasicMaterial map={texture} transparent opacity={(props.icon?.opacity ?? 1)} />
            </Plane>
        )
    }

    function SvgIcon() {
        return (
            <Svg src={props.icon?.src!} scale={0.004} position={[-0.025, 0.025, 0.1]} castShadow>
                <meshBasicMaterial color={props.textColor} />
            </Svg>
        );
    }

    function Icon() {
        return (isEmoji(props.icon?.src!)) ? <EmojiIcon /> : <SvgIcon />;
    }

    return (
        <group position={position}>
            {/* 3D Box as Button */}
            <RoundedBox
                receiveShadow
                castShadow
                {...props}
                args={[0.30, 0.30, 0.1]}
                radius={0.05} // Radius of the rounded corners. Default is 0.05
                smoothness={8} // The number of curve segments. Default is 4
                bevelSegments={0} // The number of bevel segments. Default is 4, setting it to 0 removes the bevel, as a result the texture is applied to the whole geometry.
                creaseAngle={0.4} // Smooth normals everywhere except faces that meet at an angle greater than the crease angle              
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                onPointerOver={(e) => {
                    setHovered(true);
                    props.onPointerOver?.(e);
                }
                }
                onPointerOut={(e) => {
                    setHovered(false);
                    props.onPointerOut?.(e);
                }}>
                {(props.icon) && <Icon />}
                {(text) && <Text color={props.textColor} fontWeight={'bold'} fontSize={0.05} position={[0, 0, 0]} anchorX="center" anchorY="middle" >{text}</Text>}
                {children}
                <meshStandardMaterial color={hovered ? hoverColor : active ? '#bbbbbb' : '#111188'} transparent={true} opacity={0.8} />
            </RoundedBox>
        </group>
    );
};

export const Button3DOK: React.FC<Button3DProps> = ({ position, text, onClick, children, ...props }) =>
    <Button3D {...props} position={position} icon={{ src: '✔️', filter: 'grayscale', opacity: 0.7 }} text={text} hoverColor={'#00cc00'} onClick={onClick}>{children}</Button3D>;

export const Button3DBack: React.FC<Button3DProps> = ({ position, text, onClick, children, ...props }) =>
    <Button3D {...props} position={position} icon={{ src: '🔙', opacity: 0.7 }} text={text} hoverColor={'#cc0000'} onClick={onClick}>{children}</Button3D>;

export const Button3DCancel: React.FC<Button3DProps> = ({ position, text, onClick, children, ...props }) =>
    <Button3D {...props} position={position} icon={{ src: '❌', filter: 'grayscale', opacity: 0.7 }} text={text} hoverColor={'#cc0000'} onClick={onClick}>{children}</Button3D>;

export const Button3DLeft: React.FC<Button3DProps> = ({ position, text, onClick, children, ...props }) =>
    <Button3D {...props} position={position} icon={{ src: '◀️', filter: 'blue', opacity: 0.7}} text={text} hoverColor={'#1111ff'} onClick={onClick}>{children}</Button3D>;

export const Button3DRight: React.FC<Button3DProps> = ({ position, text, onClick, children, ...props }) =>
    <Button3D {...props} position={position} icon={{ src: '▶️', filter: 'blue', opacity: 0.7}} text={text} hoverColor={'#1111ff'} onClick={onClick}>{children}</Button3D>;

