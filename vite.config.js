import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'vue-app/assets/dist',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'vue-app/src/metadata-editor.js'),
      name: 'MetadataEditor',
      formats: ['iife'],
      fileName: () => 'metadata-editor.js'
    },
    rollupOptions: {
      external: [
        'vue',
        'vuex',
        'vue-router',
        'vuetify',
        'axios',
        'vue-deepset',
        'vee-validate',
        'vue-i18n',
        'lodash',
        'splitpanes',
        'vue-json-pretty',
        'sortable',
        'vuedraggable',
        'moment',
        'leaflet',
        'chart.js',
        'ajv',
        'deepdash',
        'jquery',
        'vue-scrollto'
      ],
      output: {
        globals: {
          'vue': 'Vue',
          'vuex': 'Vuex',
          'vue-router': 'VueRouter',
          'vuetify': 'Vuetify',
          'axios': 'axios',
          'vue-deepset': 'VueDeepSet',
          'vee-validate': 'VeeValidate',
          'vue-i18n': 'VueI18n',
          'lodash': '_',
          'splitpanes': 'splitpanes',
          'vue-json-pretty': 'VueJsonPretty',
          'sortable': 'Sortable',
          'vuedraggable': 'vuedraggable',
          'moment': 'moment',
          'leaflet': 'L',
          'chart.js': 'Chart',
          'ajv': 'Ajv',
          'deepdash': 'deepdash',
          'jquery': 'jQuery',
          'vue-scrollto': 'VueScrollTo'
        },
        // Ensure single output file
        inlineDynamicImports: true
      }
    },
    // Generate non-minified output in dev mode for debugging
    minify: process.env.NODE_ENV === 'development' ? false : 'esbuild',
    sourcemap: true
  }
});
