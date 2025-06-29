import { CubicBezierLine, Sphere } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { useMainContext } from '../../hooks/useMainContext';

const ChainSphere = observer(() => {
  const { viewManager, splineManager } = useMainContext();
  const points = splineManager.staticCurvePoints;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const planeRef = useRef<THREE.Plane | null>(null);
  const { pointer, gl, camera, raycaster } = useThree();

  useEffect(() => {
    splineManager.setCurve();
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
      splineManager.setStaticCurvePoints(
        [intersect.x, intersect.y, intersect.z],
        index,
      );
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
      <CubicBezierLine
        start={points[0]}
        midA={points[1]}
        midB={points[2]}
        end={points[3]}
        // @ts-ignore
        segments={50}
      />
      {points.map((point, index) => (
        <Sphere
          args={[1]}
          position={point}
          key={'control-' + index}
          onPointerDown={(e: ThreeEvent<PointerEvent>) =>
            handlePointerDown(e, index)
          }
          onPointerUp={handlePointerUp}
        />
      ))}
      {splineManager.curve && (
        <>
          {Array.from({ length: 16 }, (_, i) => {
            return (
              <mesh
                key={i}
                ref={(ref) => {
                  if (ref) {
                    splineManager.sphereInstance[i].setMeshRef(
                      ref,
                      splineManager.curve!,
                    );
                  }
                }}
                position={splineManager.sphereInstance[i].position}
                geometry={splineManager.sphereInstance[i].geometry!}>
                <meshStandardMaterial color={'red'} side={THREE.DoubleSide} />
                {/* <sphereGeometry args={[spherePoints[i], 32, 32]} /> */}
              </mesh>
            );
          })}
        </>
      )}
      {splineManager.arrangedPoints &&
        splineManager.arrangedPoints.map((point, index) => (
          <Sphere
            args={[1]}
            position={point}
            key={'arranged-' + index}
            onPointerDown={(e: ThreeEvent<PointerEvent>) =>
              handlePointerDown(e, index)
            }
            onPointerUp={handlePointerUp}
          />
        ))}
    </>
  );
});

export default ChainSphere;
