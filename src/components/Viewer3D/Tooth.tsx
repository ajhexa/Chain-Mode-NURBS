import { useLoader } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

import { Utils } from '../../utils/Utils';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const Tooth = observer(
  ({
    no,
    setCenter,
  }: {
    no: number;
    setCenter: React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;
  }) => {
    const url = `/assets/toothLib/Tooth_${no}__Anat._Pontic__-_Full_pontic.stl`;
    const geometry = useLoader(Utils.stlLoader, url);
    useEffect(() => {
      geometry.computeBoundsTree();

      return () => {
        if (geometry.boundsTree) {
          geometry.disposeBoundsTree();
          geometry.computeBoundingBox();
          const center = new THREE.Vector3();
          geometry.boundingBox?.getCenter(center);
          setCenter((prev) => [...prev, center]);
        }
      };
    }, [geometry, setCenter]);

    return (
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
        {/* {geometry.boundingBox && (
          <box3Helper args={[geometry.boundingBox, '#ff0000']} />
          )} */}
      </mesh>
    );
  },
);

export default Tooth;
