import { makeAutoObservable } from 'mobx';

import { ModelManager } from './ModelManager';
import { SplineManager } from './SplineManager';
import { ViewManager } from './ViewManager';

export class StateManager {
  constructor() {
    makeAutoObservable(this);
  }

  private _viewManager = new ViewManager(this);
  private _splineManager = new SplineManager();
  private _modelManager = new ModelManager();

  get viewManager() {
    return this._viewManager;
  }
  get splineManager() {
    return this._splineManager;
  }
  get modelManager() {
    return this._modelManager;
  }
}
