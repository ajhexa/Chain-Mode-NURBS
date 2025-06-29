import { observer } from 'mobx-react-lite';

import Viewer3D from '../Viewer3D/Viewer3D';

export const UiComp = observer(() => {
  return <Viewer3D />;
});
