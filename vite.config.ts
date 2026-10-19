import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.VITE_BASE || '/Velocity-Hackathon-GDNU-SessionSight/',
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'gsap', test: /node_modules[\\/]gsap/ }] } },
    },
  },
});
