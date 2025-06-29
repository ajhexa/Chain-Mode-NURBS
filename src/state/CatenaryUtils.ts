import * as THREE from 'three';

export function catenary(a: number, x: number): number {
  return a * Math.cosh(x / a);
}

export const MAX_TRIES = 100;

export function getA(vecLen: number, maxLen: number): number | null {
  if (vecLen > maxLen) {
    console.warn('exceed max length of catenary');
    return null;
  }

  let e = Number.MAX_VALUE;
  let a = 100;
  let aTmp = 0;
  const maxLenHalf = 0.5 * maxLen;
  const vecLenHalf = 0.5 * vecLen;

  for (let i = 0; i < MAX_TRIES; i++) {
    aTmp = vecLenHalf / Math.asinh(maxLenHalf / a);
    e = Math.abs((aTmp - a) / a);
    a = aTmp;
    if (e < 0.001) break;
  }

  return a;
}

export function getSegmentPoints(
  v0: THREE.Vector3,
  v1: THREE.Vector3,
  maxLen: number,
  segCnt = 5,
  invert = false,
): THREE.Vector3[] {
  const vecLen = v0.distanceTo(v1);
  const vecLenHalf = vecLen * 0.5;
  const segInc = vecLen / segCnt;
  const A = getA(vecLen, maxLen);
  if (A === null) return [];

  const offset = catenary(A, -vecLenHalf);
  const rtn: THREE.Vector3[] = [];

  for (let i = 1; i < segCnt; i++) {
    const t = i / segCnt;
    const pnt = new THREE.Vector3().lerpVectors(v0, v1, t);

    const xpos = i * segInc - vecLenHalf;
    const c = offset - catenary(A, xpos);

    pnt.y += invert ? c : -c;

    rtn.push(pnt);
  }

  return rtn;
}
