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

// Vite plugin to auto-import globals that component files reference as bare identifiers.
// Even in IIFE format, each ES module is wrapped in its own closure by Rollup, so
// bare references to _, Vue, axios, EventBus etc. won't resolve unless explicitly imported.
// This plugin prepends ES import statements (resolved at bundle time by Rollup) and
// replaces runtime window globals (EventBus, bus) with window.* references.
function autoImportGlobals() {
  const npmGlobals = [
    { test: /\b_\./, importStmt: "import _ from 'lodash';" },
    { test: /\baxios\b/, importStmt: "import axios from 'axios';" },
    { test: /\bmoment\b/, importStmt: "import moment from 'moment';" },
    { test: /\bVue\./, importStmt: "import Vue from 'vue';" },
    { test: /\bVuex\./, importStmt: "import Vuex from 'vuex';" },
    { test: /\bVueRouter\b/, importStmt: "import VueRouter from 'vue-router';" },
    { test: /\bSortable\./, importStmt: "import Sortable from 'sortablejs';" },
    { test: /\bAjv\b/, importStmt: "import Ajv from 'ajv';" },
  ];

  // Runtime globals injected by PHP inline scripts or loaded via CDN/external scripts.
  // These are NOT npm packages — they live on window at runtime.
  // The plugin rewrites bare references (e.g. CI.site_url) to window.CI.site_url
  // so they resolve correctly inside Rollup's per-module closures.
  const windowGlobals = [
    { name: 'EventBus' },
    { name: 'bus' },
    { name: 'CI' },
    { name: 'L' },
    { name: 'Chart' },
    { name: 'Resumable' },
  ];

  return {
    name: 'auto-import-globals',
    transform(code, id) {
      if (!id.includes('application/views/')) return null;
      if (id.includes('vue-global-eventbus')) return null;
      if (id.includes('vue-schemas-app')) return null;

      let prepend = '';
      let transformed = code;

      for (const { test, importStmt } of npmGlobals) {
        const pkgName = importStmt.match(/from '([^']+)'/)[1];
        if (code.includes(`from '${pkgName}'`) || code.includes(`from "${pkgName}"`)) continue;
        if (test.test(code)) {
          prepend += importStmt + '\n';
        }
      }

      for (const { name } of windowGlobals) {
        const re = new RegExp(`(?<![.'"\\w])${name}(?!['"\\w])`, 'g');
        if (re.test(transformed)) {
          transformed = transformed.replace(
            new RegExp(`(?<![.'"\\w])${name}(?!['"\\w])`, 'g'),
            `window.${name}`
          );
        }
      }

      if (prepend || transformed !== code) {
        return { code: prepend + transformed, map: null };
      }
      return null;
    }
  };
}

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
  plugins: [createVuePlugin(), autoImportGlobals()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({ NODE_ENV: 'production' }),
  },
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
      // Use the full Vue build (with template compiler) instead of runtime-only.
      // The PHP pages use el: '#app' with HTML templates in the DOM, which requires
      // the compiler to parse and compile templates at runtime.
      'vue': 'vue/dist/vue.esm.js',
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@views': path.resolve(__dirname, 'application/views'),
    }
  }
});
