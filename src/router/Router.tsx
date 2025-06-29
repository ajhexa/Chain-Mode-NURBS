import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { NavigationRoutes } from '../constant';
import { Viewer } from '../pages/viewer';

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={NavigationRoutes.Default} element={<Viewer />} />
      </Routes>
    </BrowserRouter>
  );
};
