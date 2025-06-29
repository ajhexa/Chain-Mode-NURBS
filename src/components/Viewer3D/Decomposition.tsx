import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

interface Decomposition {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export function decompose(matrix: Matrix4): Decomposition {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const rotation = new Euler();
  const scale = new Vector3();

  matrix.decompose(position, quaternion, scale);
  rotation.setFromQuaternion(quaternion);

  return {
    position: position.toArray() as [number, number, number],
    rotation: rotation.toArray() as [number, number, number],
    scale: scale.toArray() as [number, number, number],
  };
}
