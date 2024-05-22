export interface Action {
  time: number;
  name: string;
  data?: any;
}

export type ActionArray = Action[];

export function sortActions(actions: ActionArray, isAscending: boolean = true) {
  return actions.sort((a, b) => (isAscending ? a.time - b.time : b.time - a.time));
}

export class ActionRunner {
  actions: ActionArray;

  currentTime: number = 0;
  isPlaying: boolean = false;
  isStopped: boolean = false;
  controller: ActionControllerInterface;

  constructor(controller: ActionControllerInterface, actions: ActionArray) {
    this.controller = controller;
    this.actions = sortActions(actions);
  }

  /**
   * Sleeps for a given number of milliseconds.
   *
   * @param ms
   * @returns
   */
  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Waits for the player to resume playing.
   */
  async waitForResume() {
    while (!this.isPlaying && !this.isStopped) {
      await this.sleep(100);
    }
  }

  /**
   * Runs an action.
   * @param action
   */
  async runAction(action: Action) {
    console.log('Running action', action);
    const { time, name, data } = action;
    await this.controller.run(name, data);
  }

  /**
   * Plays the actions.
   */
  public async play() {
    console.log('Running actions', this.actions);
    let startTime = new Date().getTime();
    let timeOffset = 0;
    if (this.actions.length > 0) {
      timeOffset = startTime - new Date(this.actions[0].time).getTime();
    }
    this.isPlaying = true;
    this.isStopped = false;
    for (let i = 0; i < this.actions.length; i++) {
      if (!this.isPlaying) {
        await this.waitForResume();
      }
      if (this.isStopped) {
        break;
      }
      const action = this.actions[i];
      const actionTime = new Date(action.time).getTime();
      this.currentTime = actionTime;
      const delay = actionTime + timeOffset - startTime;
      await this.sleep(delay);
      this.runAction(action);
    }
  }

  public async pause() {
    this.isPlaying = false;
  }

  public async resume() {
    if (!this.isStopped) {
      this.isPlaying = true;
    } else {
      await this.play();
    }
  }

  public async stop() {
    this.isPlaying = false;
    this.isStopped = true;
    this.currentTime = 0;
  }
}

export interface ActionControllerInterface {
  run: (action: string, data: any) => void;
}

export class ActionController implements ActionControllerInterface {
  // Handles camera.* actions
  public camera: ActionControllerInterface | null = null;

  // Handles avatar.* actions
  public avatar: ActionControllerInterface | null = null;

  // Handles scene.* actions
  public scene: ActionControllerInterface | null = null;

  // Handles light.* actions
  public light: ActionControllerInterface | null = null;

  // Handles sound.* actions
  public sound: ActionControllerInterface | null = null;

  // TODO: add support for other controllers, e.g. light, sound, scene, etc.
  constructor(cameraController: ActionControllerInterface, avatarController: ActionControllerInterface) {
    this.camera = cameraController;
    this.avatar = avatarController;
  }

  /**
   * This method runs an action. If the action matches a controller, it will be
   * passed to that controller. Otherwise, it will be executed as a function.
   *
   * If the action is a string, it will be parsed as a function.
   *
   * If the action contains a parameter list, it will be extracted and passed to
   * the function.
   *
   * @param action
   * @param data
   */
  public async run(action: string, data: any = {}) {
    if (action.includes('(') && action.includes(')')) {
      // Extract parameters from ( )
      data = action.match(/\(([^)]+)\)/);
      // Strip ( and ) from the string
      if (data.startsWith('{')) {
        data = JSON.parse(data);
      }
    }
    let controller = action.split('.')[0];
    if (this.hasOwnProperty(controller)) {
      await (this as any)[controller].run(action, data);
    } else if (action == 'sleep') {
      await new Promise((resolve) => setTimeout(resolve, data));
    }
    if (action) {
      let fn = new Function('data', action);
      fn(data);
    }
  }
}
