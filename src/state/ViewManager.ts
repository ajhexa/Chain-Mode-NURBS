import { OrbitControls } from 'three-stdlib';

import { StateManager } from './StateManager';

export class ViewManager {
  private _libState: StateManager;
  private _cameraRef: OrbitControls | null = null;
  constructor(libState: StateManager) {
    this._libState = libState;
  }
  setCameraRef(ref: OrbitControls) {
    this._cameraRef = ref;
  }
  get cameraState() {
    return this._cameraRef;
  }
  setUpVector(up: [number, number, number]) {
    if (!this._cameraRef) return;
    this._cameraRef.object.up.set(...up);
  }
}
