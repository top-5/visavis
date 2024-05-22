// TODO: note that Emotion type is also used in src/components/Models/AnimationModel/Emotions.ts
// and imported from src/components/Avatar/Avatar.component.tsx where it is defined as a Record<string, number>
// It would be better to define it in a separate file and import it where needed.
type Emotion = Record<string, number>;

export const EmotionHappy: Emotion = {
  mouthSmileLeft: 1,
  mouthSmileRight: 1,
  eyeSquintLeft: 0.3,
  eyeSquintRight: 0.3,
  browOuterUpLeft: 0.5,
  browOuterUpRight: 0.5
};

export const EmotionSad: Emotion = {
  mouthFrownLeft: 1,
  mouthFrownRight: 1,
  eyeSquintLeft: 0.2,
  eyeSquintRight: 0.2,
  browDownLeft: 0.5,
  browDownRight: 0.5,
  eyesLookDown: 0.4
};

export const EmotionAngry: Emotion = {
  browDownLeft: 1,
  browDownRight: 1,
  browInnerUp: 1,
  eyeSquintLeft: 0.5,
  eyeSquintRight: 0.5,
  mouthPressLeft: 0.75,
  mouthPressRight: 0.75,
  jawForward: 0.4
};

export const EmotionSurprised: Emotion = {
  browOuterUpLeft: 1,
  browOuterUpRight: 1,
  eyeWideLeft: 1,
  eyeWideRight: 1,
  mouthOpen: 0.8,
  jawOpen: 0.4
};

export const EmotionDisgusted: Emotion = {
  noseSneerLeft: 1,
  noseSneerRight: 1,
  mouthUpperUpLeft: 0.6,
  mouthUpperUpRight: 0.6,
  browDownLeft: 0.6,
  browDownRight: 0.6
};

export const EmotionFearful: Emotion = {
  browInnerUp: 1,
  eyeWideLeft: 1,
  eyeWideRight: 1,
  mouthStretchLeft: 0.5,
  mouthStretchRight: 0.5,
  jawOpen: 0.7
};

export const EmotionContempt: Emotion = {
  mouthCornerPullerLeft: 0.5, // Adjust if a corresponding node exists or use mouthLeft/mouthRight
  lipCornerDepressorLeft: 0.5, // Adjust if a corresponding node exists
  lipStretchLeft: 0.3 // Adjust if a corresponding node exists or use mouthLeft/mouthRight
};

export const EmotionNeutral: Emotion = {
  viseme_sil: 1
};

export const EmotionConfused: Emotion = {
  browInnerUp: 0.75,
  browDownRight: 0.5,
  browDownLeft: 0.5,
  eyeLookUpLeft: 0.4,
  eyeLookUpRight: 0.4,
  mouthShrugUpper: 0.6
};

export const EmotionCurious: Emotion = {
  browInnerUp: 0.5,
  eyeWideLeft: 0.3,
  eyeWideRight: 0.3,
  mouthStretchLeft: 0.3,
  mouthStretchRight: 0.3,
  eyeLookUpLeft: 0.5,
  eyeLookUpRight: 0.5
};

export const EmotionSkeptical: Emotion = {
  browDownLeft: 0.8,
  mouthFrownRight: 0.6,
  noseSneerRight: 0.4,
  eyeLookInRight: 0.3
};

export const EmotionShy: Emotion = {
  eyeLookDownRight: 0.7,
  eyeLookDownLeft: 0.7,
  mouthClose: 0.5,
  browDownLeft: 0.3,
  browDownRight: 0.3
};

export const EmotionProud: Emotion = {
  chestUp: 1, // Adjust if a corresponding node exists or use mouthUpperUpLeft/mouthUpperUpRight
  headUp: 0.8, // Adjust if a corresponding node exists
  mouthSmileLeft: 0.6,
  mouthSmileRight: 0.6,
  eyeSquintLeft: 0.4,
  eyeSquintRight: 0.4
};

export const EmotionEmbarrassed: Emotion = {
  cheekPuff: 0.8,
  mouthShrugLower: 0.5,
  eyeLookDownLeft: 0.5,
  eyeLookDownRight: 0.5,
  browInnerUp: 0.4
};

export const EmotionBored: Emotion = {
  eyeLookDownLeft: 0.6,
  eyeLookDownRight: 0.6,
  yawning: 0.8, // Adjust if a corresponding node exists or use mouthOpen/jawOpen
  mouthShrugLower: 0.4
};

export const EmotionAwe: Emotion = {
  jawOpen: 0.7,
  mouthOpen: 0.6,
  eyeWideLeft: 0.8,
  eyeWideRight: 0.8,
  browOuterUpLeft: 0.7,
  browOuterUpRight: 0.7
};

export const EmotionWink: Emotion = {
  eyeBlinkLeft: 1,
  eyeWideRight: 1,
  mouthSmileLeft: 0.8,
  mouthSmileRight: 0.8,
  browOuterUpLeft: 0.5,
  browOuterUpRight: 0.5
};

export const EmotionRaisedBrow: Emotion = {
  browInnerUp: 1,
  browOuterUpLeft: 1,
  browOuterUpRight: 1,
  mouthSmileLeft: 0.5,
  mouthSmileRight: 0.5
};

// Asymmetric Smirk
export const EmotionSmirk: Emotion = {
  mouthSmileRight: 1,
  mouthFrownLeft: 0.3,
  eyeSquintRight: 0.5,
  browDownLeft: 0.4,
  browUpRight: 0.6
};

// One eyebrow raised in curiosity or skepticism
export const EmotionOneEyebrowRaised: Emotion = {
  browOuterUpRight: 1, // Raise right eyebrow
  browOuterUpLeft: 0.2, // Keep left eyebrow relatively lower
  mouthShrugLower: 0.3 // Subtle mouth movement
};

// Winking with a slight smile
export const EmotionWinkingSmile: Emotion = {
  eyeBlinkRight: 1, // Close right eye as in a wink
  mouthSmileLeft: 0.7, // Smirk with the left side
  browOuterUpLeft: 0.4 // Slightly raise left eyebrow
};

/// Add enum for emotions
export enum EmotionKind {
  Happy,
  Sad,
  Angry,
  Surprised,
  Disgusted,
  Fearful,
  Contempt,
  Neutral,
  Confused,
  Curious,
  Skeptical,
  Shy,
  Proud,
  Embarrassed,
  Bored,
  Awe,
  Wink,
  RaisedBrow,
  Smirk,
  OneEyebrowRaised,
  WinkingSmile
}

export function getEmotion(emotion: EmotionKind): Emotion {
  switch (emotion) {
    case EmotionKind.Happy:
      return EmotionHappy;
    case EmotionKind.Sad:
      return EmotionSad;
    case EmotionKind.Angry:
      return EmotionAngry;
    case EmotionKind.Surprised:
      return EmotionSurprised;
    case EmotionKind.Disgusted:
      return EmotionDisgusted;
    case EmotionKind.Fearful:
      return EmotionFearful;
    case EmotionKind.Contempt:
      return EmotionContempt;
    case EmotionKind.Neutral:
      return EmotionNeutral;
    case EmotionKind.Confused:
      return EmotionConfused;
    case EmotionKind.Curious:
      return EmotionCurious;
    case EmotionKind.Skeptical:
      return EmotionSkeptical;
    case EmotionKind.Shy:
      return EmotionShy;
    case EmotionKind.Proud:
      return EmotionProud;
    case EmotionKind.Embarrassed:
      return EmotionEmbarrassed;
    case EmotionKind.Bored:
      return EmotionBored;
    case EmotionKind.Awe:
      return EmotionAwe;
    case EmotionKind.Wink:
      return EmotionWink;
    case EmotionKind.RaisedBrow:
      return EmotionRaisedBrow;
    case EmotionKind.Smirk:
      return EmotionSmirk;
    case EmotionKind.OneEyebrowRaised:
      return EmotionOneEyebrowRaised;
    case EmotionKind.WinkingSmile:
      return EmotionWinkingSmile;
    default:
      return EmotionNeutral;
  }
}

/// Add a function to return a random emotion based on enum value
export function randomEmotion(): Emotion {
  const selector: number = Math.floor(Math.random() * 21);
  switch (selector) {
    case EmotionKind.Happy:
      return EmotionHappy;
    case EmotionKind.Sad:
      return EmotionSad;
    case EmotionKind.Angry:
      return EmotionAngry;
    case EmotionKind.Surprised:
      return EmotionSurprised;
    case EmotionKind.Disgusted:
      return EmotionDisgusted;
    case EmotionKind.Fearful:
      return EmotionFearful;
    case EmotionKind.Contempt:
      return EmotionContempt;
    case EmotionKind.Neutral:
      return EmotionNeutral;
    case EmotionKind.Confused:
      return EmotionConfused;
    case EmotionKind.Curious:
      return EmotionCurious;
    case EmotionKind.Skeptical:
      return EmotionSkeptical;
    case EmotionKind.Shy:
      return EmotionShy;
    case EmotionKind.Proud:
      return EmotionProud;
    case EmotionKind.Embarrassed:
      return EmotionEmbarrassed;
    case EmotionKind.Bored:
      return EmotionBored;
    case EmotionKind.Awe:
      return EmotionAwe;
    case EmotionKind.Wink:
      return EmotionWink;
    case EmotionKind.RaisedBrow:
      return EmotionRaisedBrow;
    case EmotionKind.Smirk:
      return EmotionSmirk;
    case EmotionKind.OneEyebrowRaised:
      return EmotionOneEyebrowRaised;
    case EmotionKind.WinkingSmile:
      return EmotionWinkingSmile;
    default:
      return EmotionNeutral;
  }
}

export type EmotionCallback = (emotion: Emotion) => void;

export function morphEmotion(from: Emotion, to: Emotion, callback: EmotionCallback, duration: number = 85) {
  const start = performance.now();
  const startEmotion = { ...from };

  function animate(time: number) {
    let progress = (time - start) / duration;
    progress = Math.min(progress, 1);

    for (const key of Object.keys({ ...from, ...to })) {
      const diff = (to[key] ?? 0) - (startEmotion[key] ?? 0);
      from[key] = (startEmotion[key] ?? 0) + diff * progress;
    }

    for (const key of Object.keys(from)) {
      if (to[key] === undefined && from[key] === 0) {
        delete from[key];
      }
    }
    callback(from);
    // setEmotion(from);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

/**
 * This method combines the current emotion with the new emotion.
 * It modifies the current emotion in place by adding the new emotion.
 * If the new emotion is the same as the current emotion, it returns false.
 * If the new emotion is different from the current emotion, it returns true.
 *
 * @param emotion Initial emotion
 * @param newEmotion Emotion to apply
 */
export function applyEmotion(emotion: Emotion, newEmotion: Emotion): boolean {
  let updateRequired: boolean = false;
  for (const key of Object.keys(newEmotion)) {
    if (emotion[key] !== newEmotion[key]) {
      updateRequired = true;
      break;
    }
  }
  if (!updateRequired) {
    return false;
  }
  for (const key of Object.keys(newEmotion)) {
    emotion[key] = newEmotion[key];
  }
  return updateRequired;
}

/**
 * This method applies a viseme to the current emotion. If the viseme is already
 * applied, it returns false. Note that there could be only one viseme applied
 * at a time. If previous viseme is applied, it is removed before applying the
 * new viseme.
 *
 * @param emotion
 * @param viseme
 * @returns
 */
export function applyViseme(emotion: Emotion, viseme: string): boolean {
  let updateRequired: boolean = false;
  for (const key of Object.keys(emotion)) {
    if (key.includes('viseme')) {
      updateRequired = true;
      delete emotion[key];
    }
  }
  const newEmotion: Emotion = {};
  newEmotion[viseme] = 1;
  return applyEmotion(emotion, newEmotion) || updateRequired;
}

export const compareEmotions = (emotion1: Emotion, emotion2: Emotion): boolean => {
  for (const key of Object.keys(emotion1)) {
    if (emotion1[key] !== emotion2[key]) {
      return false;
    }
  }
  return true;
};

export const VisemeNames: string[] = [
  'viseme_sil',
  'viseme_PP',
  'viseme_FF',
  'viseme_TH',
  'viseme_DD',
  'viseme_kk',
  'viseme_CH',
  'viseme_SS',
  'viseme_nn',
  'viseme_RR',
  'viseme_aa', // viseme_AA
  'viseme_E',
  'viseme_I',
  'viseme_O',
  'viseme_U'
];
