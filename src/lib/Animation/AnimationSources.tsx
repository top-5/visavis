// import { useEffect } from "react";
import { AnimationItem } from 'src/lib/Animation/AnimationDictionary';

import { AnimationControl, useAnimationControl } from 'src/lib/Animation/AnimationContext';

// Internal libraries
import {
    AvatarPlayer,
    Draggable,
    Podium,
    Ground,
    Emotions,
    AvatarCameraControls,
    SceneEvents,
    useSceneEventListener,
    useSceneEventsListener,
    AnimationProvider,
    BoneHelpers,
    DebugArmature,
    CameraController,
    applyViseme,
    compareEmotions,
    SceneControls,
    fetchBlob,
    Emotion,
    useAvatarControls
} from 'src/lib';

export interface AnimationCategory {
    src?: string;
    text?: string;
    label?: string;
    uuid?: string;
}

export const animationCategories: AnimationCategory[] = [
    { text: 'Idle', label: '🧍🏼‍♀️' },
    { text: 'Walk', label: '🚶🏾' },
    { text: 'Moving', label: '🏃🏻‍♀️' },
    { text: 'Dancing', label: '🕺🏿' },
    { text: 'Expressions', label: '😉' },
    //    { text: 'General Fantasy Male', label: '🧙' },
    //    { text: 'General Fantasy Female', label: '👸🏻' },
    //    { text: 'Tools', label: '🧑‍🏭' },
    //    { text: 'Combat Weapons Fight', label: '🥷🏿' },
];

export const animationSources: string[] = [];

export async function loadAnimationAction(animations: AnimationItem[], action: string): Promise<string> {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const animationControl: AnimationControl = useAnimationControl();
    console.log('Animation source changed: ', action);

    let item: AnimationItem =
        animations.filter((item: AnimationItem) => item.url === action)[0] ??
        animations.filter((item: AnimationItem) => item.name === action)[0] ??
        animations.filter((item: AnimationItem) => item.id === action)[0];

    if (!item) {
        console.error('Animation not found: ', action);
        return "";
    }

    const blob = await fetchBlob(item.url!);
    await animationControl.loadAnimationAction(item.name!, blob);
    return action;
}
