import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';

// Build configuration for IIFE format bundles.
//
// Each entry point is built as a self-contained IIFE bundle via build.lib.
// IIFE format means:
// 1. Each bundle is a single self-contained <script> (not type="module")
// 2. No code splitting / shared chunks — everything inlined
// 3. No strict mode enforcement on PHP inline scripts
// 4. Blocking execution order — bundle runs synchronously before inline scripts
// 5. All globals (_, Vue, axios, etc.) set on window are immediately available
//    to both bundled component code and PHP inline scripts
//
// Usage:
//   VITE_ENTRY=home npx vite build        # build single entry
//   npm run build                          # build all entries (via build script)

const entries = {
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
};

const targetEntry = process.env.VITE_ENTRY;

if (!targetEntry) {
  // Fallback: if no entry specified, error with instructions
  console.error('Error: VITE_ENTRY env var required. Use "npm run build" to build all entries.');
  console.error('Available entries:', Object.keys(entries).join(', '));
  process.exit(1);
}

if (!entries[targetEntry]) {
  console.error(`Error: Unknown entry "${targetEntry}". Available: ${Object.keys(entries).join(', ')}`);
  process.exit(1);
}

export default defineConfig({
  plugins: [createVuePlugin()],
  build: {
    outDir: 'vue-app/assets/dist',
    emptyOutDir: false,
    lib: {
      entry: entries[targetEntry],
      name: targetEntry.replace(/-/g, '_'),
      formats: ['iife'],
      fileName: () => `${targetEntry}.js`,
    },
    rollupOptions: {
      output: {
        extend: true,
        inlineDynamicImports: true,
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
