import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// outDir 'build' keeps deploy-robust-pi.sh (copies dashboard/build/ -> web/) working.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true },
  build: { outDir: 'build' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
