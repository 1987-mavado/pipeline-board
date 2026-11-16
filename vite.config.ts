import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' → der Build läuft aus jedem Unterordner und jedem statischen Host.
export default defineConfig({
  base: './',
  plugins: [react()],
});
