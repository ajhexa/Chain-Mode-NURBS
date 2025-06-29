import { Html, PivotControls, Sphere } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { NURBSCurve } from 'three-stdlib';

import { useMainContext } from '../../hooks/useMainContext';
import { Utils } from '../../utils/Utils';

const CURVE_LENGTH_CONSTRAINT = 100;

function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): T {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(
        () => {
          lastCall = Date.now();
          func(...args);
          timeout = null;
        },
        limit - (now - lastCall),
      );
    }
  } as T;
}

const NurbsManipulation = observer(() => {
  const { splineManager, viewManager } = useMainContext();
  const points = splineManager.controlPointsNurbs;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [stlGeometries, setStlGeometries] = useState<THREE.BufferGeometry[]>(
    [],
  );
  const [stlGeometriesOriginal, setStlGeometriesOriginal] = useState<
    THREE.BufferGeometry[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const planeRef = useRef<THREE.Plane | null>(null);
  const { pointer, gl, camera, raycaster } = useThree();

  const [activeMeshIndex, setActiveMeshIndex] = useState<number | null>(null);

  // Load STL geometries
  useEffect(() => {
    const loadSTLGeometries = async () => {
      setIsLoading(true);
      const geometries: THREE.BufferGeometry[] = [];
      const geometriesOriginal: THREE.BufferGeometry[] = [];

      try {
        // Load STL files from toothLib folder
        for (let i = 1; i <= 16; i++) {
          try {
            const fileName = `Tooth_${i}__Anat._Pontic__-_Full_pontic.stl`;
            const filePathOriginal = `assets/toothLib/${fileName}`;
            const filePath = `assets/toothLib-dissolved/${fileName}`;

            const geometry = await Utils.loadSTLFromBlobURL(filePath);
            const geometryOriginal =
              await Utils.loadSTLFromBlobURL(filePathOriginal);
            geometries.push(geometry);
            geometriesOriginal.push(geometryOriginal);
          } catch (err) {
            // If we can't load a file, break the loop
            break;
          }
        }

        setStlGeometries(geometries);
        setStlGeometriesOriginal(geometriesOriginal);
      } catch (err) {
        // Handle error silently or with proper error handling
      } finally {
        setIsLoading(false);
      }
    };

    loadSTLGeometries();
  }, []);

  useEffect(() => {
    // splineManager.updateNurbs();
    splineManager.buildNurbsCurve();
    // splineManager.arrangeSphereOnNurbs();
  }, [points, splineManager]);

  const handleMeshClick = (index: number) => {
    if (index === activeMeshIndex) {
      setActiveMeshIndex(null);
      return;
    }
    setActiveMeshIndex(index);
  };

  // Pivot Control Methods
  const handleDrag = () => {
    if (!viewManager.cameraState) return;
    viewManager.cameraState.enabled = false;
  };
  const handleDragEnd = () => {
    if (!viewManager.cameraState) return;
    viewManager.cameraState.enabled = true;
  };

  // Nurbs Manipulation Methods
  const handlePointerDown = (e: ThreeEvent<PointerEvent>, index: number) => {
    if (!viewManager.cameraState) return;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()),
      e.point,
    );
    viewManager.cameraState.enabled = false;
    planeRef.current = plane;
    setActiveIndex(index);
    setActiveMeshIndex(null);
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
    if (!intersect) return;

    // 1. Clone control points and try the new position
    const newPoints = splineManager.controlPointsNurbs.map((pt, i) =>
      i === index ? intersect.clone() : pt.clone(),
    );
    const degree = newPoints.length - 1;

    // 2. Build a temporary NURBS curve
    const knotVector = Utils.calculateKnotVector(degree, newPoints);
    // @ts-ignore
    const tempCurve = new NURBSCurve(degree, knotVector, newPoints);

    // 3. Check the length
    const curveLength = tempCurve.getLength();
    if (curveLength > CURVE_LENGTH_CONSTRAINT) {
      // Do NOT update the control point, but allow further mouse events
      return;
    }

    // 4. If within threshold, update the control point and curve
    splineManager.updateNurbControlPoints(intersect, index);
  }, [activeIndex, castRayOnPlane, splineManager]);

  useEffect(() => {
    // const throttledMouseMove = throttle(handleMouseMove, 30);

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, handleMouseMove]);

  return (
    <>
      {isLoading && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(30,30,30,0.85)',
              borderRadius: '16px',
              boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'sans-serif',
              fontSize: '1.5rem',
              justifyContent: 'center',
              minWidth: '220px',
              padding: '32px 48px',
            }}>
            <div
              className="loader-spinner"
              style={{
                animation: 'spin 1s linear infinite',
                border: '6px solid #eee',
                borderRadius: '50%',
                borderTop: '6px solid #ffb300',
                height: 48,
                marginBottom: 24,
                width: 48,
              }}
            />
            Loading teeth...
            <style>
              {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
            </style>
          </div>
        </Html>
      )}
      {splineManager.nurbsCurveGeometry && (
        <line
          // @ts-ignore
          geometry={splineManager.nurbsCurveGeometry}>
          <lineBasicMaterial color={new THREE.Color('yellow')} linewidth={2} />
        </line>
      )}
      {points.length &&
        points.map((point, index) => {
          return (
            <Sphere
              args={[1]}
              key={index}
              position={point}
              onPointerDown={(e: ThreeEvent<PointerEvent>) =>
                handlePointerDown(e, index)
              }
              onPointerUp={handlePointerUp}>
              <meshStandardMaterial
                color={
                  activeIndex === index
                    ? new THREE.Color(0x00ff00)
                    : new THREE.Color(0xff0000)
                }
              />
            </Sphere>
          );
        })}
      {splineManager.nurbsCurve && stlGeometries.length > 0 && (
        <>
          {Array.from(
            { length: Math.min(16, stlGeometries.length) },
            (_, i) => {
              return (
                <PivotControls
                  key={i}
                  anchor={[0, 0, 0]}
                  scale={5}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  enabled={i === activeMeshIndex}
                  depthTest={false}
                  disableScaling>
                  <group onClick={() => handleMeshClick(i)}>
                    <mesh
                      ref={(ref) => {
                        if (ref) {
                          splineManager.nurbSphereInstance[i].setMeshRef(ref);
                        }
                      }}
                      key={`${i}-dissolved`}
                      position={splineManager.nurbSphereInstance[i].position}
                      rotation={splineManager.nurbSphereInstance[i].rotation}
                      geometry={stlGeometries[i]}
                      scale={[0.5, 0.5, 0.5]}>
                      <meshStandardMaterial
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                    <mesh
                      key={i}
                      position={splineManager.nurbSphereInstance[i].position}
                      rotation={splineManager.nurbSphereInstance[i].rotation}
                      geometry={stlGeometriesOriginal[i]}
                      scale={[0.5, 0.5, 0.5]}>
                      <meshStandardMaterial
                        // color={'#ffffff'}
                        color={i === activeMeshIndex ? 'cyan' : '#ffffff'}
                        metalness={0.1}
                        roughness={0.5}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  </group>
                </PivotControls>
              );
            },
          )}
        </>
      )}
    </>
  );
});

export default NurbsManipulation;
