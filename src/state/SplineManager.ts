import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';
import { NURBSCurve } from 'three-stdlib';

import { Utils } from '../utils/Utils';
import { getSegmentPoints } from './CatenaryUtils';
import { SphereGeo } from './SphereGeo';

export const spherePoints = [
  0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
  0.25, 0.25, 0.25,
];
const vec3Point = [
  new THREE.Vector3(-28.5, 12.9, -14.1),
  new THREE.Vector3(-27.0, 13.3, -8.0),
  new THREE.Vector3(-25.5, 13.6, -1.9),
  new THREE.Vector3(-23.4, 13.9, 4.8),
  new THREE.Vector3(-20.7, 14.2, 11.3),
  new THREE.Vector3(-16.8, 14.4, 17.2),
  new THREE.Vector3(-11.5, 14.6, 22.1),
  new THREE.Vector3(-5.2, 14.65, 25.0),
  new THREE.Vector3(1.2, 14.5, 24.5),
  new THREE.Vector3(7.4, 14.3, 21.4),
  new THREE.Vector3(12.8, 13.95, 16.8),
  new THREE.Vector3(17.1, 13.6, 11.5),
  new THREE.Vector3(20.1, 13.25, 5.3),
  new THREE.Vector3(22.0, 12.85, -1.1),
  new THREE.Vector3(23.5, 12.45, -7.9),
  new THREE.Vector3(24.9, 12.1, -14.3),
];
// const vec3Point = [
//   new THREE.Vector3(50, 0, 50),
//   new THREE.Vector3(30, 0, 0),
//   new THREE.Vector3(-30, 0, 0),
//   new THREE.Vector3(-50, 0, 50),
// ];
export class SplineManager {
  private _splinePoints: THREE.Vector3[] = vec3Point;
  //   private _curve: THREE.CatmullRomCurve3 | null = null;
  private _splineGeometry: THREE.TubeGeometry | null = null;
  private _controlPoints: number[] = [];
  private _offsetPoints: THREE.Vector3[] = [];
  private _staticCurvePoints: [number, number, number][] = [
    [0, 0, 0],
    [25, 50, 0],
    [50, 50, 0],
    [75, 0, 0],
  ];
  private _staticVecPoint: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(75, 0, 0),
  ];
  private _catenaryCurve: THREE.Vector3[] = [];
  private _curve: THREE.CubicBezierCurve3 | null = null;
  private _spherePoints: THREE.Vector3[] = [];
  private _sphereInstance: SphereGeo[] = [];
  private _sphereInstanceC: SphereGeo[] = [];
  private _arrangedPoints: THREE.Vector3[] = [];
  private _catmulLines: THREE.Vector3[][] = [];
  private _catmulControlPoints: THREE.Vector3[] = [];
  private _curvePath: THREE.CurvePath<THREE.Vector3> = new THREE.CurvePath();
  private _catenaryControlPoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(75, 0, 0),
  ];
  private _activeCatenaryControlPoints: number[] = [
    0,
    this._catenaryControlPoints.length - 1,
  ];
  private _catenaryCurves: THREE.CatmullRomCurve3[] = [];
  // private _controlPointsNurbs: THREE.Vector3[] = [
  //   new THREE.Vector3(35, 0, 0),
  //   new THREE.Vector3(24.74873734152916, 24.74873734152916, 0),
  //   new THREE.Vector3(2.143131898507868e-15, 35, 0),
  //   new THREE.Vector3(-24.74873734152916, 24.74873734152916, 0),
  //   new THREE.Vector3(-35, 4.286263797015736e-15, 0),
  // ];

  // private _controlPointsNurbs: THREE.Vector3[] = [
  //   new THREE.Vector3(20, 0, -10),
  //   new THREE.Vector3(20, 0, 15),
  //   new THREE.Vector3(0, 0, 30),
  //   new THREE.Vector3(-20, 0, 15),
  //   new THREE.Vector3(-20, 0, -10),
  // ];

  private _controlPointsNurbs: THREE.Vector3[] = [
    new THREE.Vector3(22, 0, -10), // Start
    new THREE.Vector3(22, 0, 6),
    new THREE.Vector3(10, 0, 25),
    new THREE.Vector3(-10, 0, 25),
    new THREE.Vector3(-22, 0, 6),
    new THREE.Vector3(-22, 0, -10), // End
  ];

  // private _controlPointsNurbs: THREE.Vector3[] = [
  //   new THREE.Vector3(25, 0, -15),
  //   new THREE.Vector3(22, 0, 10),
  //   new THREE.Vector3(15, 0, 25),
  //   new THREE.Vector3(0, 0, 30),
  //   new THREE.Vector3(-15, 0, 25),
  //   new THREE.Vector3(-22, 0, 10),
  //   new THREE.Vector3(-25, 0, -15),
  // ];

  private _nurbsCurve: NURBSCurve | null = null;
  private _nurbCurvePoints: THREE.Vector3[] = [];
  private _nurbsCurveGeometry: THREE.BufferGeometry =
    new THREE.BufferGeometry();
  private _nurbsCurveInstances: SphereGeo[] = [];
  private _originalCurve: THREE.Curve<THREE.Vector3> | null = null;
  private _curveMidU = 0.5;

  constructor() {
    makeAutoObservable(this);
    this.buildNurbsCurve();
    this.setNurbSphereInstance();
    // this.setCurve();
    // this.setSphereInstance();
    // this.buildCatenary();
    // this.setSphereInstanceC();
    // this.updateCatenary();
  }
  get geometry(): THREE.TubeGeometry | null {
    return this._splineGeometry;
  }
  setControlPoints(points: number[]) {
    this._controlPoints = points;
  }
  get controlPoints(): number[] {
    return this._controlPoints;
  }

  get staticCurvePoints(): [number, number, number][] {
    return this._staticCurvePoints;
  }
  setStaticCurvePoints(points: [number, number, number], index: number) {
    const newPoints = [...this._staticCurvePoints];
    newPoints[index] = points;
    this._staticCurvePoints = newPoints;
  }
  updateCatenaryControlPoints(points: THREE.Vector3, index: number) {
    const newPoints = [...this._catenaryControlPoints];
    newPoints[index] = points;
    this._catenaryControlPoints = newPoints;
  }
  setCurve() {
    const bezier = new THREE.CubicBezierCurve3(
      new THREE.Vector3(...this._staticCurvePoints[0]),
      new THREE.Vector3(...this._staticCurvePoints[1]),
      new THREE.Vector3(...this._staticCurvePoints[2]),
      new THREE.Vector3(...this._staticCurvePoints[3]),
    );
    this._curve = bezier;
    this.arrangeSphere();
  }
  setSphereInstance() {
    if (!this._curve) return;
    const spheres = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15; // 0 to 1 inclusive
      const pos = this._curve?.getPointAt(t);
      return new SphereGeo(spherePoints[i], pos!, i);
    });
    if (!spheres) return;
    this._sphereInstance = spheres;
  }
  setSphereInstanceC() {
    if (!this._curvePath) return;
    const spheres = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15; // 0 to 1 inclusive
      const pos = this._curvePath?.getPointAt(t);
      return new SphereGeo(spherePoints[i], pos, i);
    });
    if (!spheres) return;
    this._sphereInstanceC = spheres;
  }
  get sphereInstance(): SphereGeo[] {
    return this._sphereInstance;
  }
  get sphereInstanceC(): SphereGeo[] {
    return this._sphereInstanceC;
  }
  get curve(): THREE.CubicBezierCurve3 | null {
    return this._curve;
  }
  get staticVecPoint(): THREE.Vector3[] {
    return this._staticVecPoint;
  }
  arrangeSphere() {
    if (!this._curve) return;
    if (!this._sphereInstance.length) return;

    Array.from({ length: 16 }, (_, i) => {
      if (!this._curve) return;
      const t = i / 15;
      const pos = this._curve?.getPointAt(t);
      this._sphereInstance[i].setPosition(pos);
      this._sphereInstance[i].intersect(this._curve);
    });
    let currentT = 0.5;
    for (let i = 7; i >= 0; i--) {
      const nextT = currentT - this._sphereInstance[i].deltaT;
      const midPoint = (currentT + nextT) / 2;
      currentT = nextT;
      const arrangedPoint = this._curve.getPointAt(midPoint);
      this._sphereInstance[i].setPosition(arrangedPoint);
    }
    currentT = 0.5;
    for (let i = 8; i < 16; i++) {
      const nextT = currentT + this._sphereInstance[i].deltaT;
      const midPoint = (currentT + nextT) / 2;
      currentT = nextT;
      const arrangedPoint = this._curve.getPointAt(midPoint);
      const tangent = this._curve.getTangentAt(midPoint);
      this._sphereInstance[i].setPosition(arrangedPoint);
      this._sphereInstance[i].setTangent(tangent);
    }
  }
  get arrangedPoints(): THREE.Vector3[] {
    return this._arrangedPoints;
  }
  addCatmulLine() {
    const curvePoints = getSegmentPoints(
      this._staticVecPoint[0],
      this._staticVecPoint[1],
      100,
      50,
    );
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    this._curvePath.add(curve);
    this._catmulLines.push(curve);
    this._catenaryCurve = curvePoints;
  }
  get catenaryCurve(): THREE.Vector3[] {
    return this._catenaryCurve;
  }
  get catmulLines(): THREE.Vector3[][] {
    return this._catmulLines;
  }
  addCatmulControlPoint(point: THREE.Vector3) {
    this._catmulControlPoints.push(point);
  }
  get catmulControlPoints(): THREE.Vector3[] {
    return this._catmulControlPoints;
  }
  get curvePath(): THREE.CurvePath<THREE.Vector3> | null {
    return this._curvePath;
  }
  get catenaryControlPoints(): THREE.Vector3[] {
    return this._catenaryControlPoints;
  }
  buildCatenary() {
    for (let i = 0; i < this._catenaryControlPoints.length - 1; i++) {
      const currentControlPoint = this._catenaryControlPoints[i];
      const nextControlPoint = this._catenaryControlPoints[i + 1];
      const curvePoints = getSegmentPoints(
        currentControlPoint,
        nextControlPoint,
        100,
        50,
        true,
      );
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      this._curvePath = new THREE.CurvePath();
      this._curvePath.add(curve);
    }
    if (!this._curvePath) return;
  }
  updateCatenary() {
    for (let i = 0; i < this._catenaryControlPoints.length - 1; i++) {
      const currentControlPoint = this._catenaryControlPoints[i];
      const nextControlPoint = this._catenaryControlPoints[i + 1];
      const curvePoints = getSegmentPoints(
        currentControlPoint,
        nextControlPoint,
        100,
        50,
        true,
      );
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      this._curvePath = new THREE.CurvePath();
      this._curvePath.add(curve);
    }
    if (!this._curvePath) return;
    this.arrangeSphereOnCatenary();
  }
  arrangeSphereOnCatenary() {
    if (!this._curvePath) return;
    if (!this._sphereInstanceC.length) return;

    Array.from({ length: 16 }, (_, i) => {
      if (!this._curvePath) return;
      const t = i / 15;
      const pos = this._curvePath.getPointAt(t);
      this._sphereInstanceC[i].setPosition(pos);
      this._sphereInstanceC[i].intersectOnCatenary(this._curvePath);
    });
    let currentT = 0.5;
    for (let i = 7; i >= 0; i--) {
      const nextT = currentT - this._sphereInstanceC[i].deltaT;
      const midPoint = (currentT + nextT) / 2;
      currentT = nextT;
      const arrangedPoint = this._curvePath.getPointAt(midPoint);
      this._sphereInstanceC[i].setPosition(arrangedPoint);
    }
    currentT = 0.5;
    for (let i = 8; i < 16; i++) {
      const nextT = currentT + this._sphereInstanceC[i].deltaT;
      const midPoint = (currentT + nextT) / 2;
      currentT = nextT;
      const arrangedPoint = this._curvePath.getPointAt(midPoint);
      const tangent = this._curvePath.getTangentAt(midPoint);
      this._sphereInstanceC[i].setPosition(arrangedPoint);
      this._sphereInstanceC[i].setTangent(tangent);
    }
  }
  addCateraryControlPointCurve() {
    const catmullromCurve = new THREE.CatmullRomCurve3();
    this._catenaryCurves.push(catmullromCurve);
  }
  buildNurbsCurve() {
    const degree = this._controlPointsNurbs.length - 1;
    const knotVector = Utils.calculateKnotVector(
      degree,
      this._controlPointsNurbs,
    );
    // @ts-ignore
    const nurbs = new NURBSCurve(degree, knotVector, this._controlPointsNurbs);
    this.setOriginalCurve(nurbs);
    this._nurbCurvePoints = nurbs.getPoints(500);
    const floatArray = new Float32Array(this._nurbCurvePoints.length * 3);
    this._nurbCurvePoints.map((pt, i) => {
      floatArray.set([pt.x, pt.y, pt.z], i * 3);
    });
    this._nurbsCurve = nurbs;
    this._nurbsCurveGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(floatArray, 3),
    );
    this.arrangeSphereOnNurbs();
  }
  get nurbsCurve(): NURBSCurve | null {
    return this._nurbsCurve;
  }
  get nurbsCurvePoints(): THREE.Vector3[] {
    return this._nurbCurvePoints;
  }
  get nurbsCurveGeometry(): THREE.BufferGeometry {
    return this._nurbsCurveGeometry;
  }
  get controlPointsNurbs(): THREE.Vector3[] {
    return this._controlPointsNurbs;
  }
  updateNurbControlPoints(point: THREE.Vector3, index: number) {
    const newPoints = [...this._controlPointsNurbs];
    newPoints[index] = point;
    this._controlPointsNurbs = newPoints;
  }
  arrangeSphereOnNurbs() {
    if (!this._nurbsCurve) return;
    if (!this._nurbsCurveInstances.length) return;

    Array.from({ length: 16 }, (_, i) => {
      if (!this._nurbsCurve) return;
      const t = i / 15;
      const pos = this._nurbsCurve.getPointAt(t);
      this._nurbsCurveInstances[i].setPosition(pos);
      this._nurbsCurveInstances[i].setRotation(
        this.getNurbsCurveRotationForPosition(pos),
      );
      this._nurbsCurveInstances[i].intersectOnNurbs(this._nurbsCurve);
    });
    // let currentT = 0.5;
    let currentT = this.curveMidU;
    for (let i = 7; i >= 0; i--) {
      const nextT = currentT - this._nurbsCurveInstances[i].deltaT;
      const midPoint = (currentT + nextT) / 2;
      currentT = nextT;
      const arrangedPoint = this._nurbsCurve.getPointAt(midPoint);
      this._nurbsCurveInstances[i].setPosition(arrangedPoint);
      this._nurbsCurveInstances[i].setRotation(
        this.getNurbsCurveRotationForPosition(
          this._nurbsCurveInstances[i].position,
        ),
      );
    }
    // currentT = 0.5;
    currentT = this.curveMidU;
    for (let i = 8; i < 16; i++) {
      const nextT = currentT + this._nurbsCurveInstances[i].deltaT;
      const midPoint = (currentT + nextT) / 2;
      currentT = nextT;
      const arrangedPoint = this._nurbsCurve.getPointAt(midPoint);
      const tangent = this._nurbsCurve.getTangentAt(midPoint);
      this._nurbsCurveInstances[i].setPosition(arrangedPoint);
      this._nurbsCurveInstances[i].setRotation(
        this.getNurbsCurveRotationForPosition(
          this._nurbsCurveInstances[i].position,
        ),
      );
      this._nurbsCurveInstances[i].setTangent(tangent);
    }
  }
  setNurbSphereInstance() {
    if (!this._nurbsCurve) return;
    const spheres = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15; // 0 to 1 inclusive
      const pos = this._nurbsCurve?.getPointAt(t);
      return new SphereGeo(spherePoints[i], pos!, i);
    });
    if (!spheres) return;
    this._nurbsCurveInstances = spheres;
  }
  get nurbSphereInstance(): SphereGeo[] {
    return this._nurbsCurveInstances;
  }

  getNurbsCurveRotationForPosition(
    pos: THREE.Vector3,
  ): [number, number, number] {
    // Check if the curve exists and is valid
    if (
      !this._nurbsCurve ||
      typeof this._nurbsCurve.computeFrenetFrames !== 'function' ||
      !pos ||
      typeof pos.x !== 'number' ||
      typeof pos.y !== 'number' ||
      typeof pos.z !== 'number'
    ) {
      return [0, 0, 0];
    }

    const numSegments = 200;
    let frames;
    try {
      frames = this._nurbsCurve.computeFrenetFrames(numSegments, false);
    } catch {
      return [0, 0, 0];
    }

    if (
      !frames ||
      !Array.isArray(frames.tangents) ||
      !Array.isArray(frames.normals) ||
      !Array.isArray(frames.binormals) ||
      frames.tangents.length !== numSegments + 1 ||
      frames.normals.length !== numSegments + 1 ||
      frames.binormals.length !== numSegments + 1
    ) {
      return [0, 0, 0];
    }

    // Find closest t on the curve to this position
    let closestT = 0;
    let minDistSq = Infinity;
    const divisions = 1000;
    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      let pt;
      try {
        pt = this._nurbsCurve.getPointAt(t);
      } catch {
        continue;
      }
      if (
        !pt ||
        typeof pt.x !== 'number' ||
        typeof pt.y !== 'number' ||
        typeof pt.z !== 'number'
      ) {
        continue;
      }
      const distSq = pt.distanceToSquared(pos);
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestT = t;
      }
    }

    const frameIndex = Math.round(closestT * numSegments);

    if (
      frameIndex < 0 ||
      frameIndex > numSegments ||
      !frames.tangents[frameIndex] ||
      !frames.normals[frameIndex] ||
      !frames.binormals[frameIndex]
    ) {
      return [0, 0, 0];
    }

    const tangent = frames.tangents[frameIndex].clone().normalize();
    // const normal = frames.normals[frameIndex].clone().normalize();
    // const binormal = frames.binormals[frameIndex].clone().normalize();

    // // Build rotation matrix
    // const matrix = new THREE.Matrix4();
    // matrix.makeBasis(binormal.negate(), tangent, normal.negate());
    const referenceUp = new THREE.Vector3(0, 1, 0); // Use world up as reference
    const normal = new THREE.Vector3()
      .crossVectors(referenceUp, tangent)
      .normalize();

    if (normal.lengthSq() < 0.001) {
      const referenceRight = new THREE.Vector3(1, 0, 0);
      normal.crossVectors(tangent, referenceRight).normalize();
    }
    const matrix = new THREE.Matrix4();
    const biNormal = new THREE.Vector3().crossVectors(tangent, normal).negate();

    matrix.makeBasis(normal, tangent.negate(), biNormal);

    // Decompose to get rotation
    const quat = new THREE.Quaternion();
    matrix.decompose(new THREE.Vector3(), quat, new THREE.Vector3());
    const euler = new THREE.Euler().setFromQuaternion(quat);

    if (isNaN(euler.x) || isNaN(euler.y) || isNaN(euler.z)) {
      return [0, 0, 0];
    }

    return [euler.x, euler.y, euler.z];
  }

  get originalCurve(): THREE.Curve<THREE.Vector3> | null {
    return this._originalCurve;
  }
  setOriginalCurve(curve: THREE.Curve<THREE.Vector3>) {
    this._originalCurve = curve;
  }
  get curveMidU(): number {
    return this._curveMidU;
  }
  setCurveMidU(val: number) {
    this._curveMidU = val;
  }

  updateNurbs() {
    if (!this.originalCurve) return;
    const knotVector = Utils.calculateKnotVector(4, this._controlPointsNurbs);
    // @ts-ignore
    const nurbs = new NURBSCurve(4, knotVector, this._controlPointsNurbs);
    const oldArcLengths = this.originalCurve.getLength();
    const newTotalLength = nurbs.getLength();
    const deltaT = oldArcLengths / newTotalLength / 2;
    this.setCurveMidU(deltaT);
    this._nurbCurvePoints = nurbs.getPoints(500);
    const floatArray = new Float32Array(this._nurbCurvePoints.length * 3);
    this._nurbCurvePoints.map((pt, i) => {
      floatArray.set([pt.x, pt.y, pt.z], i * 3);
    });
    this._nurbsCurve = nurbs;
    this._nurbsCurveGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(floatArray, 3),
    );
    this.arrangeSphereOnNurbs();
  }
}
