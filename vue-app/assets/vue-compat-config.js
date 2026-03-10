// Configure Vue 3 compat mode - enable all Vue 2 compat features
if (typeof Vue !== 'undefined' && Vue.configureCompat) {
    Vue.configureCompat({
        MODE: 2 // Enable full Vue 2 compatibility mode
    });
}
