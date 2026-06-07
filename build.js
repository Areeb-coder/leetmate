import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

async function runBuild() {
  try {
    console.log('Starting Leetmate Extension Build...');

    // Ensure dist directory exists
    if (!existsSync('dist')) {
      mkdirSync('dist');
    }

    // 1. Build background service worker
    console.log('Building Background Service Worker...');
    await build({
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve('src/background/index.ts'),
          name: 'background',
          formats: ['iife'],
          fileName: () => 'background.js',
        },
        minify: true,
      },
      configFile: false,
    });

    // 2. Build injected page script (runs in MAIN world)
    console.log('Building Injected Page Script...');
    await build({
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve('src/content/inject.ts'),
          name: 'inject',
          formats: ['iife'],
          fileName: () => 'inject.js',
        },
        minify: true,
      },
      configFile: false,
    });

    // 3. Build content script as a standalone library (IIFE)
    console.log('Building Content Script (standalone IIFE)...');
    await build({
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      plugins: [react(), tailwindcss()],
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve('src/content/index.tsx'),
          name: 'content',
          formats: ['iife'],
          fileName: () => 'content.js',
        },
        minify: true,
        cssCodeSplit: false,
      },
      configFile: false,
    });

    // 4. Build popup UI
    console.log('Building Popup UI...');
    await build({
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      plugins: [react(), tailwindcss()],
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
          input: {
            popup: resolve('index.html'),
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'chunks/[name].js',
            assetFileNames: 'assets/[name].[ext]',
          }
        },
        minify: true,
      }
    });

    // 5. Copy manifest and icons
    console.log('Copying Manifest file...');
    copyFileSync('src/manifest.json', 'dist/manifest.json');

    console.log('Copying extension icons...');
    if (existsSync('src/icon.png')) {
      copyFileSync('src/icon.png', 'dist/icon.png');
    } else {
      // Fallback dummy icon
      const dummyIcon = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAAI0lEQVR42u3OMQEAAAgDoP172hNchwUkpFIKECBAgAABAgQ+LJ4C1TDRWcoAAAAASUVORK5CYII=';
      writeFileSync('dist/icon.png', Buffer.from(dummyIcon, 'base64'));
    }

    console.log('Copying asset files...');
    if (!existsSync('dist/assets')) {
      mkdirSync('dist/assets');
    }
    if (existsSync('src/assets/assistant.png')) {
      copyFileSync('src/assets/assistant.png', 'dist/assets/assistant.png');
      console.log('Copied assistant.png to dist/assets/assistant.png');
    }

    console.log('Leetmate extension build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
