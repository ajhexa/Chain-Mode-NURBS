import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { SnackbarProvider } from 'notistack';

import { Viewer } from './components/Viewer/Viewer';
import { MainContextProvider } from './hooks/useMainContext';
import { Router } from './router/Router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export const App = observer(() => {
  return <Router />;
});

export const SingleInstanceApp = observer(() => {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}>
        <MainContextProvider>
          <Viewer />
        </MainContextProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
});
