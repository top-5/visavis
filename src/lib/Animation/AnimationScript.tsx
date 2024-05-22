import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { AnimationControl } from 'src/lib/Animation/AnimationContext';

let sequenceRunning: boolean = false;

/**
 * Helper function to delay the execution of the next animation.
 * @param ms
 * @returns
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * This function runs outside of the React component and plays a sequence of animations.
 * This is done by loading the animation files and playing them one after the other.
 * The delay between each animation is 5 seconds.
 * @param animationControl
 * @returns
 */
export async function runAnimationSequence(animationControl: AnimationControl) {
  if (sequenceRunning) {
    return;
  }
  console.log('Playing animation sequence');
  sequenceRunning = true;
  const animationFiles = [
    '/F_Standing_Idle_001.fbx',
    '/feminine/Breakdance%20Freeze%20Var%201.fbx',
    '/feminine/Breakdance%20Ready.fbx',
    '/feminine/Breakdance%20Ready.fbx',
    '/feminine/Arms%20Hip%20Hop%20Dance.fbx',
    '/feminine/Breakdance%201990.fbx',
    '/feminine/Breakdance%20Freeze%20Var%201.fbx',
    '/feminine/Dancing%20Twerk.fbx',
    '/feminine/Hip%20Hop%20Dancing.fbx',
    '/feminine/Rumba%20Dancing.fbx',
    '/feminine/Silly%20Dancing.fbx',
    '/feminine/Snake%20Hip%20Hop%20Dance.fbx',

    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Jog_001.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Jog_Backwards_001.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Jog_Jump_Small_001.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Jog_Strafe_Left_002.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Jog_Strafe_Right_002.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Run_001.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Run_Backwards_001.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Run_Jump_001.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Run_Strafe_Left_001.fbx',
    'https://media.githubusercontent.com/media//readyplayerme/animation-library/master/feminine/fbx/locomotion/F_Run_Strafe_Right_001.fbx'
  ];
  for (const file of animationFiles) {
    if (!sequenceRunning) {
      break;
    }
    let clip = await animationControl.loadAnimationAction('', file);
    await delay(5000);
  }
  console.log('Animation sequence completed');
  sequenceRunning = false;
}

export async function stopAnimationSequence(animationControl: AnimationControl) {
  sequenceRunning = false;
  animationControl.stop();
}

export interface AnimationScriptProps {
  animationControl: AnimationControl;
}

export const AnimationScript: React.FC<AnimationScriptProps> = ({ animationControl }) => {
  const { scene } = useThree();
  console.log('Rendering AnimationScript');
  useEffect(() => {
    setTimeout(async () => {
      await runAnimationSequence(animationControl);
    }, 100);
  }, []);
  return null;
};
