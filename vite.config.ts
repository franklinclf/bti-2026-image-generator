import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' garante assets relativos no deploy estatico (Vercel)
export default defineConfig({
  plugins: [react()],
  base: './',
});