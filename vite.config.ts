import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const root = process.cwd();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-unbundled-src-assets',
      apply: 'build',
      closeBundle() {
        const distDir = path.resolve(root, 'dist');
        const srcAssets = path.resolve(root, 'src/assets');
        const distAssets = path.resolve(distDir, 'src/assets');

        if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
          fs.mkdirSync(path.dirname(distAssets), { recursive: true });
          fs.cpSync(srcAssets, distAssets, {
            recursive: true,
            force: true,
          });
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': root,
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});