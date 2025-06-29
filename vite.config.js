import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// This is required for Vite to work correctly with CodeSandbox
const server = {};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': resolve(new URL('./src', import.meta.url).pathname),
    },
  },
  server: server,
});
