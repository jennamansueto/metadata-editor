/**
 * vue-deepset-compat.js
 * 
 * Drop-in replacement for vue-deepset that works with Vue 3's Proxy-based reactivity.
 * In Vue 3, direct property assignment triggers reactivity, so Vue.set() is unnecessary.
 * This module provides the same API surface as vue-deepset for backward compatibility.
 */
(function (global) {
  'use strict';

  /**
   * Parse a dot-notation or bracket-notation path into an array of keys.
   * e.g. "a.b[0].c" => ["a", "b", "0", "c"]
   */
  function parsePath(path) {
    if (typeof path === 'string') {
      return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    }
    return Array.isArray(path) ? path : [path];
  }

  /**
   * Get a value at a deep path in an object.
   */
  function deepGet(obj, path) {
    var keys = parsePath(path);
    var current = obj;
    for (var i = 0; i < keys.length; i++) {
      if (current === undefined || current === null) return undefined;
      current = current[keys[i]];
    }
    return current;
  }

  /**
   * Set a value at a deep path in an object, creating intermediate objects/arrays as needed.
   * In Vue 3, direct assignment on reactive objects triggers reactivity.
   */
  function deepSet(obj, path, value) {
    var keys = parsePath(path);
    var current = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        // Create array if next key is numeric, otherwise create object
        var nextKey = keys[i + 1];
        current[key] = (!isNaN(parseInt(nextKey, 10))) ? [] : {};
      }
      current = current[key];
    }
    var lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  /**
   * Build a model helper that creates a computed-like getter/setter for deep paths.
   * This replicates the $deepModel functionality from vue-deepset.
   */
  function buildDeepModel(vm, base, path) {
    return {
      get: function () {
        return deepGet(typeof base === 'function' ? base() : base, path);
      },
      set: function (value) {
        deepSet(typeof base === 'function' ? base() : base, path, value);
      }
    };
  }

  var VueDeepSet = {
    /**
     * Vue 3 plugin install method.
     * Also supports Vue 2 compat mode (receives Vue constructor).
     */
    install: function (appOrVue) {
      var isVue3App = appOrVue && appOrVue.config && appOrVue.config.globalProperties;

      if (isVue3App) {
        // Vue 3 app instance
        appOrVue.config.globalProperties.$vueSet = function (obj, path, value) {
          deepSet(obj, path, value);
        };

        appOrVue.config.globalProperties.$vueDelete = function (obj, path) {
          var keys = parsePath(path);
          var parent = keys.length > 1 ? deepGet(obj, keys.slice(0, -1).join('.')) : obj;
          if (parent !== undefined && parent !== null) {
            var lastKey = keys[keys.length - 1];
            if (Array.isArray(parent)) {
              parent.splice(parseInt(lastKey, 10), 1);
            } else {
              delete parent[lastKey];
            }
          }
        };

        appOrVue.config.globalProperties.$deepModel = function (base, path) {
          return buildDeepModel(this, base, path);
        };
      } else {
        // Vue 2 compat mode (receives Vue constructor)
        var Vue = appOrVue;
        if (Vue && Vue.prototype) {
          Vue.prototype.$vueSet = function (obj, path, value) {
            deepSet(obj, path, value);
          };

          Vue.prototype.$vueDelete = function (obj, path) {
            var keys = parsePath(path);
            var parent = keys.length > 1 ? deepGet(obj, keys.slice(0, -1).join('.')) : obj;
            if (parent !== undefined && parent !== null) {
              var lastKey = keys[keys.length - 1];
              if (Array.isArray(parent)) {
                parent.splice(parseInt(lastKey, 10), 1);
              } else {
                delete parent[lastKey];
              }
            }
          };

          Vue.prototype.$deepModel = function (base, path) {
            return buildDeepModel(this, base, path);
          };
        }
      }
    },

    /**
     * Extend Vuex mutations with VUEX_DEEP_SET mutation.
     * This replicates VueDeepSet.extendMutation() from vue-deepset.
     */
    extendMutation: function (mutations) {
      mutations = mutations || {};
      mutations.VUEX_DEEP_SET = function (state, payload) {
        var path = payload.path;
        var value = payload.value;
        deepSet(state, path, value);
      };
      return mutations;
    },

    // Expose utilities for direct use
    deepGet: deepGet,
    deepSet: deepSet,
    parsePath: parsePath
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VueDeepSet;
  }
  if (typeof global !== 'undefined') {
    global.VueDeepSet = VueDeepSet;
  }

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
