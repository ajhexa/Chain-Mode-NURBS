import { Sphere } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { useMainContext } from '../../hooks/useMainContext';
import Tooth from './Tooth';

const TeethChain = observer(() => {
  const [transformationMatrices] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ]);
  const [centers, setCenters] = useState<THREE.Vector3[]>([]);
  const [quaternions, setQuaternions] = useState<THREE.Quaternion[]>([]);
  const { splineManager, viewManager } = useMainContext();
  const { camera, pointer, raycaster, gl } = useThree();
  if (splineManager.splinePoints.length === 0) return null;
  //   const spline = useSpline(splineManager.splinePoints, 0.3, 8);
  const activeIndexRef = useRef<number | null>(null);
  const planeRef = useRef<THREE.Plane | null>(null);
  const clickedPositionRef = useRef<THREE.Vector2 | null>(null);

  type Data = {
    binormals: THREE.Vector3;
    normals: THREE.Vector3;
    points: THREE.Vector3;
    tangents: THREE.Vector3;
  };

  const [frenetFrames, setFrenetFrames] = useState<Data[]>([]);

  const castRayOnPlane = useCallback(
    (object: THREE.Plane) => {
      raycaster.setFromCamera(pointer, camera);
      const intersects = new THREE.Vector3();
      raycaster.ray.intersectPlane(object, intersects);
      return intersects || -1;
    },
    [camera, raycaster, pointer],
  );
  const handlePointerDown = (e: ThreeEvent<PointerEvent>, index: number) => {
    if (!viewManager.cameraState) return;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()),
      e.point,
    );
    activeIndexRef.current = index;
    viewManager.cameraState.enabled = false;
    planeRef.current = plane;
    clickedPositionRef.current = pointer.clone();
  };
  const handlePointerUp = useCallback(() => {
    if (!viewManager.cameraState) return;
    if (!clickedPositionRef.current || !activeIndexRef.current) return;
    if (clickedPositionRef.current.distanceTo(pointer.clone()) < 0.01) {
      splineManager.setControlPoints([
        ...splineManager.controlPoints,
        activeIndexRef.current,
      ]);
    }
    viewManager.cameraState.enabled = true;
    activeIndexRef.current = null;
    planeRef.current = null;
  }, [viewManager, pointer, splineManager, clickedPositionRef]);
  const handleMouseMove = useCallback(() => {
    const plane = planeRef.current;
    const index = activeIndexRef.current;
    if (!plane || !index) return;
    const intersect = castRayOnPlane(plane);
    if (intersect) {
      splineManager.updateSplinePoints(index, intersect);
    }
  }, [splineManager, castRayOnPlane]);

  useEffect(() => {
    gl.domElement.addEventListener('mouseup', handlePointerUp);
    gl.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      gl.domElement.removeEventListener('mouseup', handlePointerUp);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, handlePointerUp, handleMouseMove]);

  return (
    <>
      {frenetFrames.map((tangent, index) => (
        <axesHelper args={[1]} key={index} position={tangent.points} />
      ))}
      {transformationMatrices.map((matrix, index) => (
        <Tooth no={index + 1} key={index} setCenter={setCenters} />
      ))}
      {splineManager.geometry && (
        <mesh geometry={splineManager.geometry}>
          <meshStandardMaterial color={'00ff00'} />
        </mesh>
      )}
      {splineManager.offsetPoints.map((point: THREE.Vector3, index: number) => (
        <Sphere
          key={index}
          args={[1]}
          position={point}
          onPointerDown={(e: ThreeEvent<PointerEvent>) =>
            handlePointerDown(e, index)
          }>
          <meshStandardMaterial
            color={splineManager.controlPoints.includes(index) ? 'blue' : 'red'}
          />
        </Sphere>
      ))}
    </>
  );
});

export default TeethChain;
