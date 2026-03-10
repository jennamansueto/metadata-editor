import Vue from 'vue';
import Vuetify from 'vuetify';
import axios from 'axios';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import moment from 'moment';

// Make globals available
window.Vue = Vue;
window.VueRouter = VueRouter;
window.axios = axios;
window.moment = moment;
window.Vuetify = Vuetify;
window.VueI18n = VueI18n;

// Install plugins
Vue.use(VueRouter);
Vue.use(Vuetify);
Vue.use(VueI18n);

// Import and install EventBus + global methods
import { EventBus, installGlobalMethods } from '@views/vue/vue-global-eventbus.js';
window.EventBus = EventBus;
installGlobalMethods();

// Import shared components
import AlertDialog from '@views/vue/vue-alert-dialog-component.js';
import ConfirmDialog from '@views/vue/vue-confirm-dialog-component.js';
import GlobalSiteHeader from '@views/editor_common/global-site-header-component.js';
import MainNavigationTabs from '@views/editor_common/main-navigation-tabs-component.js';

// Register components globally
Vue.component('alert-dialog', AlertDialog);
Vue.component('confirm-dialog', ConfirmDialog);
Vue.component('vue-global-site-header', GlobalSiteHeader);
Vue.component('main-navigation-tabs', MainNavigationTabs);

// Import schemas app (side-effect: creates Vue instance and mounts the app)
import '@views/schemas/vue-schemas-app.js';
