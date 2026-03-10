// Configure Vue 3 compat mode - enable all Vue 2 compat features
if (typeof Vue !== 'undefined' && Vue.configureCompat) {
    Vue.configureCompat({
        MODE: 2 // Enable full Vue 2 compatibility mode
    });
}

// Patch Vue.createApp to auto-install Vuetify components on each app instance.
// Vuetify 2.7's UMD build does not auto-install on the Vue 3 compat build,
// and createApp() creates an isolated context that doesn't inherit global
// Vue.component() registrations. This patch ensures Vuetify.install(app) is
// called on every app so all Vuetify components (v-app, v-btn, etc.) are available.
if (typeof Vue !== 'undefined' && Vue.createApp) {
    var _originalCreateApp = Vue.createApp;
    Vue.createApp = function() {
        var app = _originalCreateApp.apply(this, arguments);
        // Auto-install Vuetify if available
        if (typeof Vuetify !== 'undefined' && Vuetify.install) {
            Vuetify.install(app);
        }
        return app;
    };
}
