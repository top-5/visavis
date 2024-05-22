import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

type Emotion = Record<string, number>;

export interface BlinkerProps {
  blink: (newEmotion: Emotion) => void;
  isBlinking?: boolean;
  blinkCloseInterval?: number;
  blinkOpenInterval?: number;
}

const blinkEmotion: Emotion = {
  eyeBlinkLeft: 1,
  eyeBlinkRight: 1
};

const openEmotion: Emotion = {
  eyeBlinkLeft: 0,
  eyeBlinkRight: 0
};

export const Blinker: React.FC<BlinkerProps> = ({
  blink,
  isBlinking = true,
  blinkCloseInterval = 150,
  blinkOpenInterval = 4000
}) => {
  const blinkIntervalId = useRef<any | undefined>();

  const blinker = async () => {
    // console.log("Blink close");
    blink(blinkEmotion);
    setTimeout(() => {
      // console.log("Blink open");
      blink(openEmotion);
    }, blinkCloseInterval);
  };

  const stop = () => {
    if (blinkIntervalId.current !== undefined) {
      clearInterval(blinkIntervalId.current);
      blinkIntervalId.current = undefined;
    }
  };

  const start = () => {
    stop();
    // Start blinking once and never stop
    blinkIntervalId.current = setInterval(async () => {
      await blinker();
    }, blinkOpenInterval);
  };

  useEffect(() => {
    if (isBlinking) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [isBlinking]);

  return null;
};

Blinker.propTypes = {
  blink: PropTypes.func.isRequired,
  isBlinking: PropTypes.bool,
  blinkCloseInterval: PropTypes.number,
  blinkOpenInterval: PropTypes.number
};
