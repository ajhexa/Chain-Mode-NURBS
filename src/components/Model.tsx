import { observer } from 'mobx-react-lite';

import { useMainContext } from '../hooks/useMainContext';

const Model = observer(() => {
  const { modelManager } = useMainContext();
  if (modelManager.teethLoaded) return null;
  modelManager.loadTeeth();
  return null;
});

export default Model;
