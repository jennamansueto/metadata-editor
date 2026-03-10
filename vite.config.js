import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';

export default defineConfig({
  plugins: [createVuePlugin()],
  build: {
    outDir: 'vue-app/assets/dist',
    rollupOptions: {
      input: {
        'metadata-editor': path.resolve(__dirname, 'src/entries/metadata-editor.js'),
        'home': path.resolve(__dirname, 'src/entries/home.js'),
        'collections': path.resolve(__dirname, 'src/entries/collections.js'),
        'template-manager': path.resolve(__dirname, 'src/entries/template-manager.js'),
        'templates': path.resolve(__dirname, 'src/entries/templates.js'),
        'tags': path.resolve(__dirname, 'src/entries/tags.js'),
        'schemas': path.resolve(__dirname, 'src/entries/schemas.js'),
        'auth': path.resolve(__dirname, 'src/entries/auth.js'),
        'audit-logs': path.resolve(__dirname, 'src/entries/audit-logs.js'),
        'dashboard': path.resolve(__dirname, 'src/entries/dashboard.js'),
        'compare': path.resolve(__dirname, 'src/entries/compare.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@views': path.resolve(__dirname, 'application/views'),
    }
  }
});
