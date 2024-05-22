import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ColorEffect, applyFilter } from 'src/lib/UI/ColorEffects';

export type { ColorEffect } ;

interface EmojiMeshProps {
    unicodeCharacter: string;
    filter?: ColorEffect;
    width?: number;
    height?: number;
}

// Function to determine the appropriate font based on the browser's OS
export const getFontForOS = () => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Windows')) {
        return 'Segoe UI Emoji';
    } else if (userAgent.includes('Macintosh')) {
        return 'Apple Color Emoji';
    } else {
        // Default font for other OS or if OS detection fails
        return 'Segoe UI Emoji';
    }
};

export function getTextureFromCanvas(unicodeCharacter: string, canvasWidth: number = 128, canvasHeight: number = 128, filter: ColorEffect = 'none') {
    const fontSize = canvasHeight * 0.8; // Set the font size to 80% of canvas size
    let canvas: HTMLCanvasElement = window.document.createElement('canvas');
    // Set canvas style to display none
    canvas.setAttribute('style', 'display: none');
    canvas.setAttribute('width', `${canvasWidth}px`);
    canvas.setAttribute('height', `${canvasHeight}px`);
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px ${getFontForOS()}`;
    ctx.textRendering = 'geometricPrecision';
    ctx.fillText(unicodeCharacter, canvasWidth/2, canvasHeight/2);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = 2;
    if (filter !== 'none')
    {
        applyFilter(canvas, filter);
    }
    // Create a texture from the canvas
    return new THREE.CanvasTexture(canvas);
}

export const EmojiMesh: React.FC<EmojiMeshProps> = ({ unicodeCharacter, width=128, height=128, filter = 'none' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        setTexture(getTextureFromCanvas(unicodeCharacter,width,height,filter));
        // Cleanup: Dispose the texture
        return () => {
            texture?.dispose();
        };
    }, [unicodeCharacter]);

    return (
        <meshBasicMaterial map={texture} transparent />
    );
};
