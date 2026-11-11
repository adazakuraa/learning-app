import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' + HashRouter so the build works under any GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
});
