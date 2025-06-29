import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';

import { useMainContext } from '../../hooks/useMainContext';
import NurbsManipulation from './NurbsManipulation';

const Viewer3D = observer(() => {
  const { viewManager } = useMainContext();

  return (
    <Canvas camera={{ fov: 50, position: [0, 70, 0], up: [0, 0, 1] }}>
      <ambientLight />
      <OrbitControls
        ref={(ref) => {
          if (!ref) return;
          viewManager.setCameraRef(ref);
          // viewManager.setUpVector([0, 0, 1]);
        }}
      />
      {/* <Model /> */}
      {/* <ChainSphere /> */}
      {/* <ChainManipulation /> */}
      {/* <axesHelper args={[50]} /> */}

      <NurbsManipulation />
      <Environment preset="city" />
    </Canvas>
  );
});

export default Viewer3D;
