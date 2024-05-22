import { AnimationDictionary } from './lib/';
import { AnimationItem } from './lib/Animation/AnimationDictionary';

export async function downloadObjectAsJson<T>(filename: string, exportObj: T) {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = dataStr;
    downloadAnchorNode.download = `${filename}.json`;
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export async function prepareAnimations(): Promise<AnimationItem[]> {
    try {
        const animations = AnimationDictionary;
        const dictionary = await animations.loadAnimationDictionary('/animations/index.json');
        const dictionary2 = await animations.loadAnimationDictionary('/animations/animation-library.json');
        const all = dictionary.concat(dictionary2);
        const thumbnails = await animations.loadThumbnails('/animations/thumbnails.json');
        let result = animations.populateThumbnails(all, thumbnails);
        result = animations.fixMetadata(result);
        // Only keep items with local webm thumbnails for now
        result = result.filter((item) => item.thumbnail_animated.includes('webm'));
        return result;
    } catch (error) {
        console.error('Failed to load animation dictionary', error);
        return [];
    }
}
