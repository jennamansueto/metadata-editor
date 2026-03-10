import Vue from 'vue';
import Vuetify from 'vuetify';
import VueI18n from 'vue-i18n';
import moment from 'moment';

// Make globals available
window.Vue = Vue;
window.Vuetify = Vuetify;
window.VueI18n = VueI18n;
window.moment = moment;

// Install plugins
Vue.use(Vuetify);
Vue.use(VueI18n);

// Import the audit logs component
import AuditLogsComponent from '@views/admin/audit_logs/vue-audit-logs-component.js';

// Register the component globally
Vue.component('vue-audit-logs-component', AuditLogsComponent);
