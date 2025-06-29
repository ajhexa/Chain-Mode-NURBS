import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

export class Utils {
  public static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  static stlLoader = STLLoader;
  static getOffsetCurve(points: THREE.Vector3[], offset = 10) {
    const offsetPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      const tangent = Utils.getDirection(currentPoint, nextPoint);
      const upVector = new THREE.Vector3(0, -1, 0);
      const perpendicularDirection = Utils.getPerpendicularVector(
        tangent,
        upVector,
      );
      const point = points[i].clone();
      const offsetPoint = new THREE.Vector3()
        .copy(point)
        .add(perpendicularDirection.multiplyScalar(offset));
      offsetPoints.push(offsetPoint);
    }
    const lastPoint = points[points.length - 1];
    const lastSecondPoint = points[points.length - 2];

    const tangent = Utils.getDirection(lastSecondPoint, lastPoint);
    const upVector = new THREE.Vector3(0, -1, 0);
    const perpendicularDirection = Utils.getPerpendicularVector(
      tangent,
      upVector,
    );
    const offsetPoint = new THREE.Vector3()
      .copy(lastPoint)
      .add(perpendicularDirection.multiplyScalar(offset));
    offsetPoints.push(offsetPoint);
    return offsetPoints;
  }
  static getDirection(point1: THREE.Vector3, point2: THREE.Vector3) {
    return new THREE.Vector3().subVectors(point2, point1).normalize();
  }
  static getPerpendicularVector(
    vector: THREE.Vector3,
    upVector: THREE.Vector3,
  ) {
    const perpendicularVector = new THREE.Vector3();
    perpendicularVector.crossVectors(upVector, vector);
    return perpendicularVector;
  }
  static async loadSTLFromBlobURL(
    blobURL: string,
  ): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      loader.load(
        blobURL,
        (geometry) => {
          resolve(geometry);
        },
        undefined,
        (error) => {
          console.error('Error loading STL:', error);
          reject(error);
        },
      );
    });
  }
  static calculateOffsetPoint(
    point: THREE.Vector3,
    direction: THREE.Vector3,
    offset = 1,
  ) {}
  static calculateKnotVector(degree: number, points: THREE.Vector3[]) {
    const n = points.length;
    const d = degree;
    const m = n + d + 1;
    const knots: number[] = [];

    for (let i = 0; i < d + 1; i++) knots.push(0);
    const numInterior = m - 2 * (d + 1);
    for (let i = 1; i <= numInterior; i++) {
      knots.push(i / (numInterior + 1));
    }
    for (let i = 0; i < d + 1; i++) knots.push(1);

    return knots;
  }
}
