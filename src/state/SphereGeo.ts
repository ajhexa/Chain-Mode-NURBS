import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import { NURBSCurve } from 'three-stdlib';
// Add BVH support to THREE.Mesh
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

export class SphereGeo {
  private _radius: number;
  private _position: THREE.Vector3;
  private _tangent: THREE.Vector3 | null = null;
  private _offsetPoint: THREE.Vector3 | null = null;
  private _geometry: THREE.SphereGeometry | null = null;
  private _intersection: THREE.Vector3[] = [];
  private _meshRef: THREE.Mesh | null = null;
  private _arcLengths: number[] = [];
  private _no: number;
  private _mesh: THREE.Mesh | null = null;
  private _material: THREE.MeshStandardMaterial | null = null;
  private _deltaT = 0;
  private _rotation: [number, number, number] = [0, 0, 0];

  constructor(radius: number, position: THREE.Vector3, no: number) {
    this._radius = radius;
    this._position = position;
    this.setGeometry(new THREE.SphereGeometry(radius, 16, 16));
    this.setMaterial();
    this.setMesh();

    this.setPosition(position);
    this._no = no;
  }
  setGeometry(geometry: THREE.SphereGeometry) {
    this._geometry = geometry;
    this._geometry.computeBoundsTree();
  }
  setMaterial() {
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    this._material = material;
  }
  setPosition(position: THREE.Vector3) {
    this._position = position;
  }
  setTangent(tangent: THREE.Vector3) {
    this._tangent = tangent;
  }
  get geometry() {
    return this._geometry;
  }
  get position() {
    return this._position;
  }
  get tangent() {
    return this._tangent;
  }
  get material() {
    return this._material;
  }
  get rotation() {
    return this._rotation;
  }
  setRotation(rotation: [number, number, number]) {
    this._rotation = rotation;
  }
  intersect(curve: THREE.Curve<THREE.Vector3>) {
    if (!this._meshRef) return;

    // Optimize: Use fewer points for initial detection
    const initialPoints = 200;
    const maxPoints = 1000;
    let curvePoints = curve.getSpacedPoints(initialPoints);
    const raycaster = new THREE.Raycaster();
    const result: THREE.Vector3[] = [];

    // Reuse vectors to avoid garbage collection
    const direction = new THREE.Vector3();

    // Optimize: Use Set for faster duplicate detection
    const seenPoints = new Set<string>();
    const tolerance = 1e-9;

    const checkAndAddPoint = (point: THREE.Vector3) => {
      const key = `${Math.round(point.x / tolerance)},${Math.round(point.y / tolerance)},${Math.round(point.z / tolerance)}`;

      if (!seenPoints.has(key)) {
        seenPoints.add(key);
        result.push(point.clone());
        return true;
      }
      return false;
    };

    let foundIntersections = 0;
    const maxIntersections = 4;

    for (
      let i = 0;
      i < curvePoints.length - 1 && foundIntersections < maxIntersections;
      i++
    ) {
      const start = curvePoints[i];
      const end = curvePoints[i + 1];

      direction.subVectors(end, start);
      const maxDistance = direction.length();
      direction.normalize();

      raycaster.set(start, direction);
      raycaster.far = maxDistance;

      const hits: THREE.Intersection[] = [];
      this._meshRef.raycast(raycaster, hits);

      for (const hit of hits) {
        if (checkAndAddPoint(hit.point)) {
          foundIntersections++;
          if (foundIntersections >= maxIntersections) break;
        }
      }
    }

    // If we found too few intersections, try with higher resolution
    if (foundIntersections < 2 && curvePoints.length < maxPoints) {
      curvePoints = curve.getSpacedPoints(maxPoints);
      seenPoints.clear();
      result.length = 0;
      foundIntersections = 0;

      for (
        let i = 0;
        i < curvePoints.length - 1 && foundIntersections < maxIntersections;
        i++
      ) {
        const start = curvePoints[i];
        const end = curvePoints[i + 1];

        direction.subVectors(end, start);
        const maxDistance = direction.length();
        direction.normalize();

        raycaster.set(start, direction);
        raycaster.far = maxDistance;

        const hits: THREE.Intersection[] = [];
        this._meshRef.raycast(raycaster, hits);

        for (const hit of hits) {
          if (checkAndAddPoint(hit.point)) {
            foundIntersections++;
            if (foundIntersections >= maxIntersections) break;
          }
        }
      }
    }

    this.getIntersectionArcLengths(curve, result);
  }
  intersectOnCatenary(curve: THREE.CurvePath<THREE.Vector3>) {
    if (!this._meshRef) return;

    // Optimize: Use fewer points for initial detection
    const initialPoints = 200;
    const maxPoints = 1000;
    let curvePoints = curve.getPoints(initialPoints);
    const raycaster = new THREE.Raycaster();
    const result: THREE.Vector3[] = [];

    // Reuse vectors to avoid garbage collection
    const direction = new THREE.Vector3();

    // Optimize: Use Set for faster duplicate detection
    const seenPoints = new Set<string>();
    const tolerance = 1e-5;

    const checkAndAddPoint = (point: THREE.Vector3) => {
      const key = `${Math.round(point.x / tolerance)},${Math.round(point.y / tolerance)},${Math.round(point.z / tolerance)}`;

      if (!seenPoints.has(key)) {
        seenPoints.add(key);
        result.push(point.clone());
        return true;
      }
      return false;
    };

    let foundIntersections = 0;
    const maxIntersections = 4;

    for (
      let i = 0;
      i < curvePoints.length - 1 && foundIntersections < maxIntersections;
      i++
    ) {
      const start = curvePoints[i];
      const end = curvePoints[i + 1];

      direction.subVectors(end, start);
      const maxDistance = direction.length();
      direction.normalize();

      raycaster.set(start, direction);
      raycaster.far = maxDistance;

      const hits: THREE.Intersection[] = [];
      this._meshRef.raycast(raycaster, hits);

      for (const hit of hits) {
        if (checkAndAddPoint(hit.point)) {
          foundIntersections++;
          if (foundIntersections >= maxIntersections) break;
        }
      }
    }

    // If we found too few intersections, try with higher resolution
    if (foundIntersections < 2 && curvePoints.length < maxPoints) {
      curvePoints = curve.getPoints(maxPoints);
      seenPoints.clear();
      result.length = 0;
      foundIntersections = 0;

      for (
        let i = 0;
        i < curvePoints.length - 1 && foundIntersections < maxIntersections;
        i++
      ) {
        const start = curvePoints[i];
        const end = curvePoints[i + 1];

        direction.subVectors(end, start);
        const maxDistance = direction.length();
        direction.normalize();

        raycaster.set(start, direction);
        raycaster.far = maxDistance;

        const hits: THREE.Intersection[] = [];
        this._meshRef.raycast(raycaster, hits);

        for (const hit of hits) {
          if (checkAndAddPoint(hit.point)) {
            foundIntersections++;
            if (foundIntersections >= maxIntersections) break;
          }
        }
      }
    }

    this.getIntersectionArcLengths(curve, result);
  }
  get arcLengths() {
    return this._arcLengths;
  }

  get intersection() {
    return this._intersection;
  }
  setMeshRef(meshRef: THREE.Mesh) {
    this._meshRef = meshRef;
  }
  get meshRef() {
    return this._meshRef;
  }
  getIntersectionArcLengths(
    curve: THREE.Curve<THREE.Vector3>,
    intersections: THREE.Vector3[],
  ) {
    if (!intersections.length) return;
    if (intersections.length < 2) {
      if (this._no !== 0 && this._no !== 15) {
        return;
      }
      if (this._no == 0) {
        const curveStart = curve.getPointAt(0);
        intersections.push(curveStart);
      } else if (this._no == 15) {
        const curveEnd = curve.getPointAt(1);
        intersections.unshift(curveEnd);
      }
    }

    const prevT = this.getClosestTOnCurve(intersections[0], curve);
    const nextT = this.getClosestTOnCurve(intersections[1], curve);
    this._deltaT = nextT - prevT;
  }
  get deltaT() {
    return this._deltaT;
  }
  getClosestTOnCurve(
    point: THREE.Vector3,
    curve: THREE.Curve<THREE.Vector3>,
    divisions = 1000,
  ): number {
    // Use binary search for better performance
    let left = 0;
    let right = 1;
    let closestT = 0;
    let minDistance = Infinity;

    // First pass: coarse search
    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      const curvePoint = curve.getPointAt(t);
      const dist = curvePoint.distanceToSquared(point);
      if (dist < minDistance) {
        minDistance = dist;
        closestT = t;
      }
    }

    // Second pass: fine search around the closest point
    const step = 1 / divisions;
    const searchRange = step * 2;
    left = Math.max(0, closestT - searchRange);
    right = Math.min(1, closestT + searchRange);

    const fineDivisions = 100;
    for (let i = 0; i <= fineDivisions; i++) {
      const t = left + (right - left) * (i / fineDivisions);
      const curvePoint = curve.getPointAt(t);
      const dist = curvePoint.distanceToSquared(point);
      if (dist < minDistance) {
        minDistance = dist;
        closestT = t;
      }
    }

    return closestT;
  }
  setMesh() {
    if (!this._geometry || !this._material) return;
    const mesh = new THREE.Mesh(this._geometry, this._material);
    mesh.position.copy(this._position.clone());
    this._mesh = mesh;
  }
  get mesh() {
    return this._mesh;
  }
  intersectOnNurbs(curve: NURBSCurve) {
    if (!this._meshRef) return;

    // Optimize: Use fewer points for initial detection, increase only if needed
    const initialPoints = 200;
    const maxPoints = 1000;
    let curvePoints = curve.getPoints(initialPoints);
    const raycaster = new THREE.Raycaster();
    const result: THREE.Vector3[] = [];

    // Reuse vectors to avoid garbage collection
    const direction = new THREE.Vector3();

    // Optimize: Use Set for faster duplicate detection
    const seenPoints = new Set<string>();
    const tolerance = 1e-5;

    const checkAndAddPoint = (point: THREE.Vector3) => {
      // Create a key for the point with reduced precision
      const key = `${Math.round(point.x / tolerance)},${Math.round(point.y / tolerance)},${Math.round(point.z / tolerance)}`;

      if (!seenPoints.has(key)) {
        seenPoints.add(key);
        result.push(point.clone());
        return true;
      }
      return false;
    };

    let foundIntersections = 0;
    const maxIntersections = 2; // Most spheres will have 0-2 intersections

    for (
      let i = 0;
      i < curvePoints.length - 1 && foundIntersections < maxIntersections;
      i++
    ) {
      const start = curvePoints[i];
      const end = curvePoints[i + 1];

      direction.subVectors(end, start);
      const maxDistance = direction.length();
      direction.normalize();

      raycaster.set(start, direction);
      raycaster.far = maxDistance;

      const hits: THREE.Intersection[] = [];
      this._meshRef.raycast(raycaster, hits);

      for (const hit of hits) {
        if (checkAndAddPoint(hit.point)) {
          foundIntersections++;
          if (foundIntersections >= maxIntersections) break;
        }
      }
    }

    // If we found too few intersections, try with higher resolution
    if (foundIntersections < 2 && curvePoints.length < maxPoints) {
      curvePoints = curve.getPoints(maxPoints);
      seenPoints.clear();
      result.length = 0;
      foundIntersections = 0;

      for (
        let i = 0;
        i < curvePoints.length - 1 && foundIntersections < maxIntersections;
        i++
      ) {
        const start = curvePoints[i];
        const end = curvePoints[i + 1];

        direction.subVectors(end, start);
        const maxDistance = direction.length();
        direction.normalize();

        raycaster.set(start, direction);
        raycaster.far = maxDistance;

        const hits: THREE.Intersection[] = [];
        this._meshRef.raycast(raycaster, hits);

        for (const hit of hits) {
          if (checkAndAddPoint(hit.point)) {
            foundIntersections++;
            if (foundIntersections >= maxIntersections) break;
          }
        }
      }
    }

    this.getIntersectionArcLengths(curve, result);
  }
}
