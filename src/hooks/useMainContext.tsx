import React, { ReactNode } from 'react';

import { StateManager } from '../state/StateManager';

export const MainContext = React.createContext<StateManager>(
  new StateManager(),
);

export const MainContextProvider = ({ children }: { children: ReactNode }) => {
  return (
    <MainContext.Provider value={new StateManager()}>
      {children}
    </MainContext.Provider>
  );
};

export const useMainContext = () => React.useContext(MainContext);
