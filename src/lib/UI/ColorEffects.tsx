export type ColorEffect = 'red' | 'green' | 'blue' | 'none' | 'sepia' | 'grayscale' | 'invert';

export type ColorEffectTransform = { [key: string]: { red: number[]; green: number[]; blue: number[]; } };

export const colorEffects: ColorEffectTransform = {
    'red': {
        red: [1, 0, 0],
        green: [0, 0, 0],
        blue: [0, 0, 0]
    },
    'green': {
        red: [0, 0, 0],
        green: [0, 1, 0],
        blue: [0, 0, 0]
    },
    'blue': {
        red: [0, 0, 0],
        green: [0, 0, 0],
        blue: [0, 0, 1]
    },
    'sepia': {
        red: [0.393, 0.769, 0.189],
        green: [0.349, 0.686, 0.168],
        blue: [0.272, 0.534, 0.131]
    },
    'grayscale': {
        red: [0.33, 0.33, 0.33],
        green: [0.33, 0.33, 0.33],
        blue: [0.33, 0.33, 0.33]
    },
    'invert': {
        red: [-1, 0, 0],
        green: [0, -1, 0],
        blue: [0, 0, -1]
    }
};

export function applyFilter(canvas: HTMLCanvasElement, effect: ColorEffect = 'none') {
    if (effect === 'none') return;

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;

    // Get the image data from the entire canvas
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    // Use the specified effect or default to sepia if the effect is not defined
    const transform = colorEffects[effect as keyof typeof colorEffects];

    // Modify each pixel to sepia
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if ((effect === 'grayscale' || effect === 'red' || effect === 'green' || effect === 'blue') &&
            (r === g && g === b)) {
                continue;
            };

        // Calculate new RGB values
        data[i] = transform.red[0] * r + transform.red[1] * g + transform.red[2] * b;
        data[i + 1] = transform.green[0] * r + transform.green[1] * g + transform.green[2] * b;
        data[i + 2] = transform.blue[0] * r + transform.blue[1] * g + transform.blue[2] * b;

        // Handle inversion separately to translate color values correctly
        if (effect === 'invert') {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }

        // Ensure the RGB values are within the 0-255 range
        data[i] = Math.min(255, Math.max(0, data[i]));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
    }

    // Place the modified image data back into the canvas
    ctx.putImageData(imageData, 0, 0);
}
