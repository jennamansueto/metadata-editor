// VueDeepSet compatibility shim for Vue 3
// Vue 3's Proxy-based reactivity handles deep object mutations natively,
// so VueDeepSet's core functionality is no longer needed.
(function() {
    var VueDeepSet = {
        // extendMutation: just passes through the mutations object unchanged
        extendMutation: function(mutations) {
            return mutations;
        },
        install: function(Vue) {
            // Provide $deepModel as a computed-like accessor for Vuex state
            Vue.mixin({
                methods: {
                    $deepModel: function(key) {
                        return this.$store.state[key];
                    }
                }
            });
        }
    };
    
    // Expose globally
    if (typeof window !== 'undefined') {
        window.VueDeepSet = VueDeepSet;
    }
})();
