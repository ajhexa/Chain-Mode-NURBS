import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import { NURBSCurve } from 'three-stdlib';

import { useMainContext } from '../../hooks/useMainContext';

interface NurbsManipulationProps {
  degree: number;
  numControlPoints: number;
}

const generateDentalArchPoints = (count: number): Vector3[] => {
  const width = 10;
  const height = 5;
  const points: Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = Math.PI * t;
    const x = (width / 2) * Math.cos(angle);
    const y = height * Math.sin(angle);
    points.push(new Vector3(x, y, 0));
  }
  return points;
};

const NurbsManipulation: React.FC<NurbsManipulationProps> = observer(
  ({ degree, numControlPoints }) => {
    const { camera } = useThree();
    const { cameraManager } = useMainContext();

    const [points, setPoints] = useState<Vector3[]>(() =>
      generateDentalArchPoints(numControlPoints),
    );
    const [selected, setSelected] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Ensure degree is safe
    const safeDegree = Math.min(degree, points.length - 2);

    const weights = useMemo(
      () => Array(points.length).fill(1),
      [points.length],
    );

    const controlPoints4D = useMemo(
      () => points.map((pt, i) => new Vector4(pt.x, pt.y, pt.z, weights[i])),
      [points, weights],
    );

    const knotVector = useMemo(() => {
      const n = points.length;
      const d = safeDegree;
      const m = n + d + 1;
      const knots: number[] = [];

      for (let i = 0; i < d + 1; i++) knots.push(0);
      const numInterior = m - 2 * (d + 1);
      for (let i = 1; i <= numInterior; i++) {
        knots.push(i / (numInterior + 1));
      }
      for (let i = 0; i < d + 1; i++) knots.push(1);

      return knots;
    }, [points, safeDegree]);

    const nurbsCurve = useMemo(
      () => new NURBSCurve(safeDegree, knotVector, controlPoints4D),
      [safeDegree, knotVector, controlPoints4D],
    );

    const nurbsPoints = useMemo(() => nurbsCurve.getPoints(200), [nurbsCurve]);

    // Dragging references
    const dragPlaneNormal = useRef<Vector3 | null>(null);
    const dragPlanePoint = useRef<Vector3 | null>(null);
    const dragOffset = useRef<Vector3 | null>(null);

    useEffect(() => {
      const handleMouseMove = (event: MouseEvent) => {
        if (
          isDragging &&
          selected !== null &&
          dragPlaneNormal.current &&
          dragPlanePoint.current
        ) {
          event.preventDefault();

          const mouse = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
          );

          const raycaster = new Raycaster();
          raycaster.setFromCamera(mouse, camera);

          const plane = new Plane();
          plane.setFromNormalAndCoplanarPoint(
            dragPlaneNormal.current,
            dragPlanePoint.current,
          );

          const intersection = new Vector3();
          raycaster.ray.intersectPlane(plane, intersection);

          if (intersection) {
            const adjusted = intersection
              .clone()
              .add(dragOffset.current ?? new Vector3());
            setPoints((prev) =>
              prev.map((pt, i) => (i === selected ? adjusted : pt)),
            );
          }
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setSelected(null);
        cameraManager.enableCamera();
        dragPlaneNormal.current = null;
        dragPlanePoint.current = null;
        dragOffset.current = null;
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, selected, camera, cameraManager]);

    return (
      <group>
        {/* Control Polygon */}
        {points.length >= 2 &&
          (() => {
            const geometry = new BufferGeometry();
            const positionArray = new Float32Array(points.length * 3);
            points.forEach((pt, i) => {
              positionArray.set([pt.x, pt.y, pt.z], i * 3);
            });
            geometry.setAttribute(
              'position',
              new Float32BufferAttribute(positionArray, 3),
            );
            const material = new LineDashedMaterial({
              color: 0xffffff,
              dashSize: 0.2,
              gapSize: 0.2,
              linewidth: 1,
            });
            const line = new Line(geometry, material);
            (line as any).computeLineDistances?.();
            return <primitive object={line} />;
          })()}

        {/* NURBS Curve */}
        {nurbsPoints.length > 1 &&
          (() => {
            const geometry = new BufferGeometry();
            const curveArray = new Float32Array(nurbsPoints.length * 3);
            nurbsPoints.forEach((pt, i) => {
              curveArray.set([pt.x, pt.y, pt.z], i * 3);
            });
            geometry.setAttribute(
              'position',
              new Float32BufferAttribute(curveArray, 3),
            );
            const material = new LineBasicMaterial({
              color: 0xffff00,
            });
            const line = new Line(geometry, material);
            return <primitive object={line} />;
          })()}

        {/* Control Point Spheres */}
        {points.map((pt, i) => (
          <mesh
            key={i}
            position={pt}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelected(i);
              setIsDragging(true);
              cameraManager.disableCamera();

              const normal = new Vector3();
              camera.getWorldDirection(normal);
              dragPlaneNormal.current = normal.clone();
              dragPlanePoint.current = pt.clone();

              const mouse = new Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1,
              );
              const raycaster = new Raycaster();
              raycaster.setFromCamera(mouse, camera);

              const plane = new Plane();
              plane.setFromNormalAndCoplanarPoint(normal, pt);
              const intersection = new Vector3();
              raycaster.ray.intersectPlane(plane, intersection);
              dragOffset.current = pt.clone().sub(intersection);
              console.log('NURBS Curve:', nurbsCurve);
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'default')}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color={selected === i ? '#00ff00' : '#ff0000'} />
          </mesh>
        ))}
      </group>
    );
  },
);

export default NurbsManipulation;
