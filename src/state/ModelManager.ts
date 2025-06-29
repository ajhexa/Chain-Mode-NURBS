import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

import { Utils } from '../utils/Utils';

export class ModelManager {
  private _teethLoaded = false;
  private _teeth: THREE.BufferGeometry[] = [];
  constructor() {
    makeAutoObservable(this);
  }
  async loadTeeth() {
    const path1 = 'assets/toothLib/Tooth_1__Anat._Pontic__-_Full_pontic.stl';
    const path2 = 'assets/toothLib/Tooth_2__Anat._Pontic__-_Full_pontic.stl';
    const path3 = 'assets/toothLib/Tooth_3__Anat._Pontic__-_Full_pontic.stl';
    const tooth1 = await Utils.loadSTLFromBlobURL(path1);
    const tooth2 = await Utils.loadSTLFromBlobURL(path2);
    const tooth3 = await Utils.loadSTLFromBlobURL(path3);
    this._teeth = [tooth1, tooth2, tooth3];
    this._teethLoaded = true;
  }
  get teethLoaded() {
    return this._teethLoaded;
  }
  get teeth() {
    return this._teeth;
  }
}
