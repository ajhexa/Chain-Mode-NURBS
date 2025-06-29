import { useDistanceConstraint, useTrimesh } from '@react-three/cannon';
import { useLoader } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';

import { useMainContext } from '../hooks/useMainContext';

const Chain = observer(() => {
  const { modelManager } = useMainContext();
  const geometry1 = useLoader(
    STLLoader,
    'assets/toothLib/Tooth_1__Anat._Pontic__-_Full_pontic.stl',
  );
  const geometry2 = useLoader(
    STLLoader,
    'assets/toothLib/Tooth_1__Anat._Pontic__-_Full_pontic.stl',
  );
  const geometry3 = useLoader(
    STLLoader,
    'assets/toothLib/Tooth_1__Anat._Pontic__-_Full_pontic.stl',
  );
  const geometry1Merged = mergeVertices(geometry1.clone());
  const geometry2Merged = mergeVertices(geometry2.clone());
  const geometry3Merged = mergeVertices(geometry3.clone());

  const vertices1 = geometry1Merged.attributes.position.array;
  const indices1 = Array.from({ length: vertices1.length / 3 }, (_, i) => i);

  const vertices2 = geometry2Merged.attributes.position.array;
  const indices2 = Array.from({ length: vertices2.length / 3 }, (_, i) => i);

  const vertices3 = geometry3Merged.attributes.position.array;
  const indices3 = Array.from({ length: vertices3.length / 3 }, (_, i) => i);

  const [link1] = useTrimesh(() => ({
    args: [vertices1, indices1],
    mass: 1,
    position: [0, 0, 0],
  }));
  const [link2, api2] = useTrimesh(() => ({
    args: [vertices2, indices2],
    mass: 1,
    position: [0, 10, 0],
  }));
  const [link3, api3] = useTrimesh(() => ({
    args: [vertices3, indices3],
    mass: 0,
    position: [0, 20, 0],
    type: 'Static',
  }));

  useDistanceConstraint(link1, link2, {
    distance: 8,
  });

  useDistanceConstraint(link2, link3, {
    distance: 8,
  });
  return (
    <group>
      <group>
        <mesh geometry={geometry1} castShadow ref={link1}>
          <meshStandardMaterial color={'orange'} />
        </mesh>
      </group>
      <group
        onClick={() => {
          api2.applyImpulse([3, 3, 3], [0, 0, 0]);
        }}>
        <mesh geometry={geometry2} castShadow ref={link2}>
          <meshStandardMaterial color={'yellow'} />
        </mesh>
      </group>
      <group
        onClick={() => {
          api3.applyImpulse([3, 3, 3], [0, 0, 0]);
        }}>
        <mesh geometry={geometry3} castShadow ref={link3}>
          <meshStandardMaterial color={'green'} />
        </mesh>
      </group>
    </group>
  );
});

export default Chain;
