import { CatmullRomLine, Sphere } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { useMainContext } from '../../hooks/useMainContext';

const ChainManipulation = observer(() => {
  const { splineManager, viewManager } = useMainContext();
  const points = splineManager.catenaryControlPoints;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const planeRef = useRef<THREE.Plane | null>(null);
  const { pointer, gl, camera, raycaster } = useThree();

  useEffect(() => {
    splineManager.updateCatenary();
  }, [points, splineManager]);
  const handlePointerDown = (e: ThreeEvent<PointerEvent>, index: number) => {
    if (!viewManager.cameraState) return;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()),
      e.point,
    );
    viewManager.cameraState.enabled = false;
    planeRef.current = plane;
    setActiveIndex(index);
  };
  const handlePointerUp = () => {
    if (!viewManager.cameraState) return;
    planeRef.current = null;
    setActiveIndex(null);
    viewManager.cameraState.enabled = true;
  };
  const castRayOnPlane = useCallback(
    (plane: THREE.Plane) => {
      raycaster.setFromCamera(pointer, camera);
      const intersects = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersects);
      return intersects || -1;
    },
    [camera, pointer, raycaster],
  );
  const handleMouseMove = useCallback(() => {
    const plane = planeRef.current;
    const index = activeIndex;
    if (!plane || index === null) return;
    const intersect = castRayOnPlane(plane);
    if (intersect) {
      splineManager.updateCatenaryControlPoints(intersect, index);
    }
  }, [activeIndex, castRayOnPlane, splineManager]);

  useEffect(() => {
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, handleMouseMove]);
  return (
    <>
      {splineManager.catmulLines.length > 0 &&
        splineManager.catmulLines.map((line, i) => {
          return <CatmullRomLine key={i} points={line} />;
        })}
      {splineManager.catenaryCurve.length > 0 && (
        <CatmullRomLine points={splineManager.catenaryCurve} />
      )}
      {splineManager.catenaryControlPoints.length &&
        splineManager.catenaryControlPoints.map((point, index) => {
          return (
            <Sphere
              args={[1]}
              key={index}
              position={point}
              onPointerDown={(e: ThreeEvent<PointerEvent>) =>
                handlePointerDown(e, index)
              }
              onPointerUp={handlePointerUp}
            />
          );
        })}
      {splineManager.sphereInstanceC.length && (
        <>
          {Array.from({ length: 16 }, (_, i) => {
            return (
              <mesh
                key={i}
                position={splineManager.sphereInstanceC[i].position}
                geometry={splineManager.sphereInstanceC[i].geometry!}>
                <meshStandardMaterial color={'red'} side={THREE.DoubleSide} />
              </mesh>
            );
          })}
        </>
      )}
    </>
  );
});

export default ChainManipulation;
