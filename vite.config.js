import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = { '/api': 'http://localhost:3001' };

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_DEMO ? './' : '/',
  build: { target: 'es2022' },
  server: { proxy },
  preview: { proxy },
});
