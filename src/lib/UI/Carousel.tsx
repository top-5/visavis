import { Billboard, Circle, Plane, Sparkles, useCursor, useTexture } from '@react-three/drei';
import React, { Ref, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Group, Object3D, Vector3 } from 'three';
import { Button3DBack, Button3DLeft, Button3DOK, Button3DRight, MirrorMaterial } from './Button3D';
import { ColorEffect, getTextureFromCanvas } from './EmojiMesh';
import { useGraph, useThree } from '@react-three/fiber';
import { Content, Root, VideoContainer } from '@react-three/uikit';
import { SceneEvents, emit } from './SceneEvents';

export interface CarouselItem {
  src?: string;
  text?: string;
  id?: string;
  name?: string;
  label?: string;
  index: number;
  visible?: boolean;
  ref: RefObject<Group>;
  mediaItemRef?: RefObject<HTMLVideoElement> | RefObject<HTMLImageElement> | RefObject<HTMLAudioElement> | RefObject<HTMLMediaElement>;
}

export interface CarouselProps {
  name?: string;
  items: Omit<CarouselItem, 'index' | 'ref' | 'mediaItemRef'>[];
  farScale?: number;
  windowSize?: number;
  totalAngle?: number;
  cx?: number;
  cy?: number;
  cz?: number;
  RX?: number;
  RY?: number;
  zAngle?: number;
  angleOffset?: number;
  animationSteps?: number;
  onItemSelected?: (index: number) => void;
  onCanceled?: () => void;
  //  visible?: boolean;
  // previewSize?: { width: number, height: number };
  videoSize?: { width: number, height: number };
  children?: React.ReactNode[];
  onKeyDown?: (event: KeyboardEvent, target?: any) => void;
}

export const DefaultCarouselProps: CarouselProps = {
  items: [],
  farScale: 0.3,
  windowSize: 5,
  totalAngle: 1.5 * (2 * Math.PI) / 2,
  cx: 0,
  cy: 1,
  cz: 1,
  angleOffset: 0,
  RX: 0.6,
  RY: 0.6,
  zAngle: 0,
  animationSteps: 10,
  //  previewSize: { width: 64, height: 64 },
  videoSize: { width: 192, height: 192 }
};

export const getCarouselItemPosition = (index: number, total: number, RX: number, RY: number, angleOffset: number = 0) => {
  const angle = (index / total) * 2 * Math.PI / 2 + angleOffset;
  const x = RX * Math.cos(angle);
  const y = RY * Math.sin(angle);
  return [x, y, 0];
};

export const getCarouselItemScale = (currentIndex: number, itemIndex: number) => {
  const distance = Math.abs(currentIndex - itemIndex);
  if (distance < 1) return 1;
  return 1 / (2 * distance * distance);
};

export const getItemScale = (currentIndex: number, itemIndex: number, farScale: number) => {
  const distance = Math.abs(currentIndex - itemIndex);
  return 1 - distance * farScale!;
};

export const animateScale = (element: Object3D, from: number, to: number, stepCount: number = 10) => {
  if (!element) return;
  setTimeout(async () => {
    const delta: number = (to - from) / stepCount;
    let scale = from;
    for (let i = 0; i < stepCount; i++) {
      scale += delta;
      requestAnimationFrame(() => {
        element.scale.set(scale, scale, scale);
        element.updateWorldMatrix(true, true);
      });
      await new Promise(resolve => setTimeout(resolve, 17));
    }
  }, 20);
};

export const createMediaItemRef = (item: CarouselItem) => {
  if (item.src?.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|mpg|mpeg|m4v|3gp|3g2|ogv|oga|ogx|spx|opus)$/i)) {
    return React.createRef<HTMLVideoElement>();
  }
  if (item.src?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif|jfif|pjpeg|pjp)$/i)) {
    return React.createRef<HTMLImageElement>();
  }
  if (item.src?.match(/\.(mp3|m4a|aac|flac|ogg|wav|wma|ra|rm|rmvb)$/i)) {
    return React.createRef<HTMLAudioElement>();
  }
  return React.createRef<HTMLMediaElement>();
};

function createMutableRef<T>(current: T): React.MutableRefObject<T> {
  return { current };
}

export class CarouselBase {

  props: CarouselProps;
  currentIndexRef: React.MutableRefObject<number> = createMutableRef(0);
  _newIndex: number = 0;
  animatingRef: React.MutableRefObject<boolean> = createMutableRef(false);
  itemsRef: React.MutableRefObject<CarouselItem[]> = createMutableRef([]);

  constructor(props: CarouselProps) {
    this.props = props;
    this.setItems(props.items);
  }

  setItems = (items: Omit<CarouselItem, 'index' | 'ref' | 'mediaItemRef'>[]) => {
    this.itemsRef.current = items.map((item, index) => {
      const mediaItemRef = createMediaItemRef(item as CarouselItem);
      return { ...item, index, ref: React.createRef<Group>(), mediaItemRef };
    });
    if (this.itemsRef.current.length > 0) {
      this.currentIndexRef.current = 0;
    } else {
      this.currentIndexRef.current = -1;
    }
  }

  get currentIndex() {
    return this.currentIndexRef.current;
  }

  get newIndex() {
    return this._newIndex;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event, this);
      return;
    }
  }

  set onKeyDown(handler: (event: KeyboardEvent, target?: any) => void) {
    this.handleKeyDown = handler;
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  getItemPosition = (item: CarouselItem) => {
    const relativeIndex = item.index! - this.currentIndexRef.current;
    const [x, y] = getCarouselItemPosition(relativeIndex, this.props.windowSize! * 2, this.props.RX!, this.props.RY!, this.props.angleOffset!);
    let z = this.props.cz ?? 0;
    if (this.props.zAngle) {
      z += y * Math.sin(this.props.zAngle);
    }
    return new Vector3(x, y, z);
  }

  adjustPosition = (item: CarouselItem, offset: number) => {
    if (!item.ref.current || !this.currentIndexRef || this.itemsRef.current.length === 0) return;
    const relativeIndex = item.index! + offset - this.currentIndexRef.current;
    const scale = getItemScale(Math.round(this.currentIndexRef.current), item.index! + offset, this.props.farScale!);
    const [x, y] = getCarouselItemPosition(relativeIndex, this.props.windowSize! * 2, this.props.RX!, this.props.RY!, this.props.angleOffset!);
    let z = this.props.cz ?? 0;
    if (this.props.zAngle) {
      z += y * Math.sin(this.props.zAngle);
    }
    const distance = Math.abs(Math.round(this.currentIndexRef.current) - relativeIndex);
    const itemGroup = item.ref.current as Group;
    const visible = Math.abs(this.currentIndexRef.current - item.index) < this.props.windowSize!;
    item.visible = visible;
    if (itemGroup) {
      itemGroup.visible = visible;
      itemGroup.position.set(x!, y!, z!);
      itemGroup.scale.set(scale, scale, scale);
      itemGroup.matrixWorldNeedsUpdate = true;
      itemGroup.visible = visible;
      if (item.mediaItemRef?.current instanceof HTMLVideoElement) {
        const video = item.mediaItemRef.current as HTMLVideoElement;
        if (video) {
          video.src = (visible) ? item.src! : "";
        }
      }
    }
  };

  rotateCarousel = (offset: number) => {
    if (!this.itemsRef.current || this.itemsRef.current.length === 0) return;
    this.itemsRef.current.forEach((item: CarouselItem) => this.adjustPosition(item, offset));
  };

  onTransitionStarted = (index: number) => {
    if (!this.itemsRef.current || !this.currentIndexRef.current) return;
    console.log('Carousel: onTransitionStarted: ', index);
    const currentIndex = this.currentIndexRef.current;
    if (currentIndex < 0 || currentIndex >= this.props.items.length) {
      console.log('Invalid currentIndex: ', currentIndex);
    }
    let currentItem = this.itemsRef.current[currentIndex];
    if (currentItem && currentItem.mediaItemRef?.current instanceof HTMLVideoElement) {
      const currentVideo = currentItem.mediaItemRef?.current as HTMLVideoElement;
      // this.itemsRef.current[currentIndex]?.mediaItemRef?.current as HTMLVideoElement;
      if (currentVideo) {
        const currentGroupRef = currentItem.ref.current;
        if (currentVideo.src) {
          if (!currentVideo.paused) {
            currentVideo.pause();
          }
        }
      }
    }
  };

  onTransitionDone = async (index: number) => {
    console.log('Carousel: onTransitionDone: ', index);
    const currentIndex = this.currentIndexRef.current;
    if (currentIndex < 0 || currentIndex >= this.props.items.length) {
      console.log('Invalid currentIndex: ', currentIndex);
    }
    let currentItem = this.itemsRef.current[currentIndex];
    if (!currentItem) {
      console.log('Invalid currentItem: ', currentIndex);
      return;
    }
    const currentVideo = currentItem?.mediaItemRef?.current as HTMLVideoElement;
    if (currentVideo) {
      if (!currentVideo.src) {
        currentVideo.src = currentItem.src!;
      }
      try {
        await currentVideo.play();
      } catch (error) {
        //console.log('Error playing video: ', error);
      }
    }
  };

  pause = () => {
    const currentIndex = this.currentIndex;
    if (currentIndex < 0 || currentIndex >= this.props.items.length) {
      console.log('Invalid currentIndex: ', currentIndex);
      return;
    }
    let currentItem = this.itemsRef.current[currentIndex];
    if (!currentItem) {
      console.log('Invalid currentItem: ', currentIndex);
      return;
    }
    const currentVideo = currentItem?.mediaItemRef?.current as HTMLVideoElement;
    if (currentVideo) {
      if (!currentVideo.paused) {
        currentVideo.pause();
      }
    }
  }

  transitionTo = async (newIndex: number) => {
    if (!this.itemsRef.current || this.itemsRef.current.length === 0) return;
    this._newIndex = newIndex;
    console.log('Carousel: transitionTo: ', newIndex);
    const stepCount = this.props.animationSteps;
    let currentStep = 0;
    const delta = this.currentIndexRef.current - newIndex;
    const offset = delta / stepCount!;

    const videoElement = this.itemsRef.current[this.currentIndexRef.current]?.mediaItemRef?.current as HTMLVideoElement;
    if (videoElement) {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    }

    this.onTransitionStarted(newIndex);

    const animate = () => {
      if (currentStep < stepCount!) {
        currentStep += 1;
        this.rotateCarousel(offset * currentStep);
        requestAnimationFrame(animate);
      } else {
        if (newIndex < 0) {
          newIndex = this.props.items.length - 1;
        } else if (newIndex >= this.props.items.length) {
          newIndex = 0;
        }
        this.animatingRef.current = false;
        this.currentIndexRef.current = newIndex;
        this.rotateCarousel(0);
        this.onTransitionDone(this.currentIndexRef.current);
      }
    };

    animate();
  };

  prevItem = (): number => {
    if (!this.itemsRef.current || this.itemsRef.current.length === 0) return -1;

    let newIndex = this.currentIndexRef.current;
    if (this.currentIndexRef.current > 0 && !this.animatingRef.current) {
      newIndex -= 1;
    }
    if (newIndex !== this.currentIndexRef.current) {
      this.animatingRef.current = true;
      this.transitionTo(newIndex);
    }
    return newIndex;
  };

  nextItem = (): number => {
    if (!this.itemsRef.current || this.itemsRef.current.length === 0) return -1;

    let newIndex = this.currentIndexRef.current;
    if (this.currentIndexRef.current < this.props.items.length - 1 && !this.animatingRef.current) {
      newIndex += 1;
    }
    if (newIndex !== this.currentIndexRef.current) {
      this.animatingRef.current = true;
      this.transitionTo(newIndex);
    }
    return newIndex;
  };

  onItemSelected = (index: number) => {
    console.log('Item selected: ', index);
    this.props.onItemSelected?.(index);
  };

  onCanceled = () => {
    console.log('Carousel canceled');
    this.props.onCanceled?.();
  };
};

export const VideoGroup: React.FC<{ item: CarouselItem, parent: CarouselBase }> = ({ item, parent }) => {
  return (
    <group ref={item.ref} visible={false}>
      <Root>
        <VideoContainer
          castShadow receiveShadow
          ref={item.mediaItemRef as RefObject<HTMLVideoElement>}
          key={`video-${item.index}`}
          muted loop
          borderRadius={4} width={parent.props.videoSize!.width} height={parent.props.videoSize!.height}
          onClick={() => {
            console.log('VideoContainer clicked, VideoItem: ', item.index);
/*
            if (parent.currentIndexRef.current !== item.index) {
              parent.animatingRef.current = true;
              parent.transitionTo(item.index);
            }
 */
          }}
        />
      </Root>
    </group>
  );
};

export const EmojiGroup: React.FC<{ item: CarouselItem, parent: CarouselBase, filter: ColorEffect }> = ({ item, parent, filter = 'none' }) => {
  let texture = getTextureFromCanvas(item.label!, 128, 128, filter);
  return (
    <group ref={item.ref}>
      <Plane
        castShadow receiveShadow
        key={`emoji-${item.index}`}
        scale={[1, 1, 1]}
        args={[0.3, 0.3]} position={[0, 0, 0]}
        onClick={() => {
          console.log('Image clicked, CategoryItem: ', item.index);
          if (parent.currentIndexRef.current !== item.index) {
            parent.animatingRef.current = true;
            parent.transitionTo(item.index);
          }
        }}>
        <meshBasicMaterial map={texture} transparent />
      </Plane>
    </group>
  );
};

export const ImageGroup: React.FC<{ item: CarouselItem, parent: CarouselBase, position?: Vector3 }> = ({ item, parent, position = new Vector3(0, 0, 0) }) => {
  const texture = useTexture(item.src!);
  return (
    <group ref={item.ref} position={position}>
      <Plane
        castShadow receiveShadow
        key={`image-${item.index}`}
        scale={[1, 1, 1]}
        args={[0.25, 0.25]} position={[0, 0, 0]}
        onClick={() => {
          console.log('Image clicked, CategoryItem: ', item.index);
          if (parent.currentIndexRef.current !== item.index) {
            parent.animatingRef.current = true;
            parent.transitionTo(item.index);
          }
        }}>
        <meshBasicMaterial map={texture} transparent />
      </Plane>
    </group>
  );
};

interface DoubleCarouselProps {
  inner: CarouselProps;
  outer: CarouselProps;
  onItemSelected?: (id: string) => void;
  onCanceled: () => void;
  visible: boolean;
  position?: Vector3;
  ref?: RefObject<Group>;
}

export const DoubleCarousel: React.FC<DoubleCarouselProps> = ({ inner, outer, visible, position, ...props }) => {

  const [hovered, setHovered] = useState(false);
  useCursor(hovered, /*'pointer', 'auto', document.body*/);

  const billboardPosition: Vector3 = position ?? new Vector3(0, 1, 1);
  const keyboardAllowed = useRef(true);
  const handleKeyDown = async (event: KeyboardEvent, target: any) => {
    if (!keyboardAllowed.current) return;
    const car = target as CarouselBase;
    console.log("Event: ", event.key, " Target: ", target.constructor.name, " Carousel: ", car);
    switch (event.key) {
      // Inner carousel is for videos and controlled by ArrowLeft and ArrowRight keys
      case 'ArrowLeft':
        if (car === carousel2.current) {
          car.nextItem();
        }
        break;
      case 'ArrowRight':
        if (car === carousel2.current) {
          car.prevItem();
        }
        break;
      // Outer carousel is for categories and controlled by ArrowUp and ArrowDown keys
      case 'ArrowUp':
        if (car === carousel.current) {
          let newIndex: number = car.prevItem();
          if (newIndex !== car.currentIndexRef.current) {
            await selectCategory(car.itemsRef.current[newIndex].text!);
          }
        }
        break;
      case 'ArrowDown':
        if (car === carousel.current) {
          let newIndex: number = car.nextItem();
          if (newIndex !== car.currentIndexRef.current) {
            await selectCategory(car.itemsRef.current[newIndex].text!);
          }
        }
        break;
      // Enter key selects the current video
      case 'Enter':
        if (car === carousel2.current) {
          const id = carousel2.current.itemsRef.current[carousel2.current.currentIndexRef.current].id!;
          emit(SceneEvents.AnimationSelected, { id });
          props.onItemSelected?.(id);
          keyboardAllowed.current = false;
        }
        break;
      // Escape key cancels the selection
      case 'Escape':
        props.onCanceled();
        keyboardAllowed.current = false;
        break;
    }
  }

  useEffect(() => {
    setTimeout(() => {
      keyboardAllowed.current = visible;
    }, 100);
  }, [visible]);

  inner.onKeyDown = handleKeyDown;
  inner.name = 'inner';
  inner = { ...DefaultCarouselProps, ...inner };

  outer.onKeyDown = handleKeyDown;
  outer.name = 'outer';
  outer = { ...DefaultCarouselProps, ...outer };

  const { scene } = useThree();
  const { nodes } = useGraph(scene);

  const carousel = useRef(new CarouselBase(outer));
  const carousel2 = useRef(new CarouselBase(inner));
  const billboardRef: React.RefObject<Group> = props.ref ?? createMutableRef(null);
  const videoGroupRef: React.RefObject<Group> = useRef<Group>(null);
  // const [categoryVisible, setCategoryVisible] = React.useState<boolean>(false);

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const { itemsRef, currentIndexRef, onItemSelected: onCategorySelected } = carousel.current;
  const { itemsRef: videosRef, currentIndexRef: currentVideoIndexRef, onItemSelected: onVideoSelected } = carousel2.current;
  const [category, setCategory] = React.useState<string>(outer.items[0].text!);

  async function selectCategory(newCategory: string) {
    carousel2.current.pause();
    let i = 0;
    let items: Omit<CarouselItem, "index" | "ref" | "mediaItemRef">[] = [];
    inner.items.forEach((item, index) => {
      if (item.text!.includes(newCategory)) {
        items.push(item);
      }
    });
    // Hide the current category videos with animation
    animateScale(videoGroupRef.current as Object3D, 1, 0, 10);
    setTimeout(() => {
      if (window.speechSynthesis) {
        let utterance = new SpeechSynthesisUtterance(newCategory);
        speechSynthesis.speak(utterance);
      }
      carousel2.current.setItems(items);
      setCategory(newCategory);
    }, 200); // Wait for the animation to complete
  }

  useEffect(() => {
    carousel2.current.animatingRef.current = true;
    // Show the new category videos with animation
    carousel2.current.transitionTo(0).then(() => {
      animateScale(videoGroupRef.current as Object3D, 0, 1, 10);
    });
  }, [category]);

  const { cx, cy, cz, RX, RY, videoSize } = outer;
  const { cx: cx2, cy: cy2, cz: cz2, RX: RX2, RY: RY2 } = inner;

  useEffect(() => {
    const car = carousel.current;
    const car2 = carousel2.current;
    car.componentDidMount();
    car2.componentDidMount();

    car.rotateCarousel(0.001);
    car.transitionTo(0);
    // setCategoryVisible(true);

    return () => {
      car.componentWillUnmount();
      car2.componentWillUnmount();
    }
  }, []);

  const colorSelectorActive: string = '#00cc00';
  const colorSelectorInactive: string = '#cccccc';
  const [selectorColor, setSelectorColor] = React.useState<string>(colorSelectorInactive);

  function selectItem() {
      var event = new KeyboardEvent('keydown', { key: 'Enter' });
      handleKeyDown(event, carousel2.current);
    }

  function returnBack()
  {
    var event = new KeyboardEvent('keydown', { key: 'Escape' });
    handleKeyDown(event, carousel2.current);
  }

  return (
    <>
      <Billboard ref={billboardRef} position={billboardPosition} scale={[0.5, 0.5, 0.5]} visible={visible}>

        <Circle args={[RX! * 1.0, 32]} position={[cx!, cy!, cz! - 0.2]} castShadow receiveShadow>
          <meshStandardMaterial color="black" transparent={true} opacity={0.1} metalness={2} roughness={1} />
          <Sparkles color={'white'} size={1} />
        </Circle>

        <Circle args={[RX! * 1.0, 32]} position={[cx!, cy!, cz! - 0.1]} key={'categoryWheelConstant'} castShadow receiveShadow>
          <meshStandardMaterial color="white" transparent={true} opacity={0} />
          {itemsRef.current.map((item: CarouselItem) => (
            <EmojiGroup
              item={item} parent={carousel.current}
              key={`category-${item.index}`}
              filter={(carousel.current.newIndex === item.index) ? 'none' : 'grayscale'} />
          ))}
        </Circle>

        <group ref={videoGroupRef} position={[cx2!, cy2!, cz2!]} scale={[0, 0, 0]}>
          {videosRef.current.map((item: CarouselItem) => (
            <VideoGroup key={`vg-${item.index}`} item={item} parent={carousel2.current} />
          ))}
        </group>

        <Circle args={[RX! * 0.4, 32]} position={[cx!, cy!, cz! + 0.5]}
          onPointerEnter={() => { setHovered(true); setSelectorColor(colorSelectorActive) }}
          onPointerLeave={() => { setHovered(false); setSelectorColor(colorSelectorInactive) }}
          onClick={() => selectItem() }
          onDoubleClick={() => selectItem()}
          >
          <meshStandardMaterial color={selectorColor} transparent={true} opacity={0.6} />
        </Circle>

        <Button3DLeft position={[-1, 0, 0.15]}
          onClick={() => {carousel2.current.nextItem();}}
          onPointerOver={() => { setHovered(true); }}
          onPointerOut={() => { setHovered(false); }}/>

        <Button3DRight position={[1, 0, 0.15]}
          onClick={() => {carousel2.current.prevItem();}}
          onPointerOver={() => { setHovered(true); }}
          onPointerOut={() => { setHovered(false); }}/>

        <Button3DBack position={[0, 1, 0.15]}
          onClick={() => returnBack()}
          onPointerOver={() => { setHovered(true); setSelectorColor(colorSelectorInactive); }}
          onPointerOut={() => { setHovered(false); }}
        />

      </Billboard>
    </>
  );

}
