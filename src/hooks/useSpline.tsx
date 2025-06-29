import { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';

export interface Spline {
  isLoaded: boolean;
  geometry: THREE.TubeGeometry;
  curve: THREE.CatmullRomCurve3;
}

export const useSpline = (
  points: THREE.Vector3[],
  thickness: number,
  radialSegments: number,
): Spline | null => {
  const [state, setState] = useState<Spline | null>(null);
  const loader = useCallback(() => {
    if (!points) {
      setState(null);
      return;
    }
    const curve = new THREE.CatmullRomCurve3(
      points,
      false, // Open curve
      'catmullrom',
      0.5,
    );
    const geometry = new THREE.TubeGeometry(
      curve,
      points.length * 10,
      thickness, // thickness
      radialSegments,
      false, // Open tube
    );
    setState({
      curve,
      geometry,
      isLoaded: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    loader();
  }, [loader]);
  return state;
};
