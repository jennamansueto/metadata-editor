import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import axios from 'axios';
import VueI18n from 'vue-i18n';
import VueDeepSet from 'vue-deepset';
import Ajv from 'ajv';
import deepdash from 'deepdash-es';
import VueJsonPretty from 'vue-json-pretty';
import _ from 'lodash';
import moment from 'moment';
import jQuery from 'jquery';

// Make globals available
window.Vue = Vue;
window.Vuex = Vuex;
window.VueRouter = VueRouter;
window.axios = axios;
window._ = _;
window.moment = moment;
window.Vuetify = Vuetify;
window.VueI18n = VueI18n;
window.VueDeepSet = VueDeepSet;
window.Ajv = Ajv;
window.deepdash = deepdash;
window.VueJsonPretty = VueJsonPretty;
window.jQuery = jQuery;
window.$ = jQuery;

// Install plugins
Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VueDeepSet);

// Import components
import LoginComponent from '@views/metadata_editor/vue-login-component.js';
import TemplateRevisionHistory from '@views/templates/vue-template-revision-history.js';
import TemplateShareComponent from '@views/templates/vue-template-share-component.js';
import TemplateShareCommon from '@views/templates/vue-template-share-common-component.js';
import TemplateAclCommon from '@views/templates/vue-template-acl-common-component.js';
import TemplateAcl from '@views/templates/vue-template-acl-component.js';
import TemplateUuid from '@views/templates/vue-template-uuid-component.js';
import GlobalSiteHeader from '@views/editor_common/global-site-header-component.js';
import MainNavigationTabs from '@views/editor_common/main-navigation-tabs-component.js';

// Register components globally
Vue.component('v-login', LoginComponent);
Vue.component('template-revision-history', TemplateRevisionHistory);
Vue.component('template-share', TemplateShareComponent);
Vue.component('template-share-common', TemplateShareCommon);
Vue.component('template-acl-common', TemplateAclCommon);
Vue.component('template-acl', TemplateAcl);
Vue.component('template-uuid', TemplateUuid);
Vue.component('vue-global-site-header', GlobalSiteHeader);
Vue.component('main-navigation-tabs', MainNavigationTabs);
Vue.component('VueJsonPretty', VueJsonPretty);
