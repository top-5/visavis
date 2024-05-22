import * as THREE from 'three';
import { hairStrandShader } from './Avatar/HairStrandShader';

export async function fetchBlob(url: string): Promise<Blob> {
  try {
    const response = await fetch(url);
    if (response.redirected) {
      console.log('Redirected to:', response.url);
      const redirectedResponse = await fetch(response.url);
      if (!redirectedResponse.ok) {
        throw new Error('Error fetching the Blob');
      }
      return await redirectedResponse.blob();
    }
    if (!response.ok) {
      throw new Error('Error fetching the Blob');
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching the Blob:', error);
    throw error;
  }
}

export function cleanupThreeObject(object: THREE.Object3D) {
  object.traverse((child: any) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material: { map: { dispose: () => void }; dispose: () => void }) => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      } else {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    }
  });
  if (object.parent) {
    object.parent.remove(object);
  }
}

export function findLowestPoint(object: THREE.Object3D): number {
  let lowestPoint = Infinity;
  object.traverse((child: THREE.Object3D) => {
    child.updateMatrixWorld();
    const worldPosY = child.getWorldPosition(new THREE.Vector3()).y;
    if (worldPosY < lowestPoint) {
      lowestPoint = worldPosY;
    }
  });
  return lowestPoint;
}

export const offscreenRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

export function renderTexture(
  shader: THREE.ShaderMaterial,
  renderer: THREE.WebGLRenderer,
  renderTarget: THREE.WebGLRenderTarget
) {
  const quadGeometry = new THREE.PlaneGeometry(2, 2); // Geometry to cover the entire render target
  const quad = new THREE.Mesh(quadGeometry, shader); // Use hairMaterial here
  const rtScene = new THREE.Scene();
  rtScene.add(quad);

  // Render to the target
  renderer.setRenderTarget(renderTarget);
  renderer.render(rtScene, new THREE.Camera());
  renderer.setRenderTarget(null); // Reset to default
}

/**
 * This function finds the top parent of the object in the scene.
 *
 * @param object
 * @returns
 */
export function findTopParent(object: THREE.Object3D): THREE.Object3D {
  while (object.parent?.type !== 'Scene') {
    object = object.parent!;
  }
  return object;
}

/*
export function blendTextures(baseTexture: THREE.MeshNormalMaterial, newImageURL: URL, material: THREE.MeshStandardMaterial) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = baseTexture.image.width;
  canvas.height = baseTexture.image.height;

  // Load the new image
  const newImage = new Image();
  newImage.src = newImageURL;
  newImage.onload = () => {
    // Draw the base texture
    ctx.drawImage(baseTexture.image, 0, 0, canvas.width, canvas.height);
    // Set blending mode (optional, depends on desired effect)
    ctx.globalAlpha = 0.5;  // Adjust transparency of the top image
    ctx.drawImage(newImage, 0, 0, canvas.width, canvas.height);

    // Create a new texture from canvas and update the material
    const blendedTexture = new THREE.CanvasTexture(canvas);
    material.map = blendedTexture;
    material.map.needsUpdate = true;  // Important to update the texture in the scene
    material.needsUpdate = true;      // Ensure the material itself is updated
  };
}
*/
