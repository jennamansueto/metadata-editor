import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import axios from 'axios';
import VueI18n from 'vue-i18n';
import _ from 'lodash';
import moment from 'moment';
import jQuery from 'jquery';

// Make globals available
window.Vue = Vue;
window.VueRouter = VueRouter;
window.axios = axios;
window._ = _;
window.moment = moment;
window.Vuetify = Vuetify;
window.VueI18n = VueI18n;
window.jQuery = jQuery;
window.$ = jQuery;

// Install plugins
Vue.use(VueRouter);

// Import components
import LoginComponent from '@views/metadata_editor/vue-login-component.js';
import TreeList from '@views/collections/vue-tree-list-component.js';
import CollectionsComponent from '@views/collections/vue-collections-component.js';
import EditCollection from '@views/collections/vue-edit-collection-component.js';
import ManageUsers from '@views/collections/vue-manage-users-component.js';
import CopyCollection from '@views/collections/vue-copy-collection-component.js';
import MoveCollection from '@views/collections/vue-move-collection-component.js';
import GlobalSiteHeader from '@views/editor_common/global-site-header-component.js';
import MainNavigationTabs from '@views/editor_common/main-navigation-tabs-component.js';

// Register components globally
Vue.component('v-login', LoginComponent);
Vue.component('vue-tree-list', TreeList);
Vue.component('vue-collections-component', CollectionsComponent);
Vue.component('vue-edit-collection', EditCollection);
Vue.component('vue-manage-users', ManageUsers);
Vue.component('vue-copy-collection', CopyCollection);
Vue.component('vue-move-collection', MoveCollection);
Vue.component('vue-global-site-header', GlobalSiteHeader);
Vue.component('main-navigation-tabs', MainNavigationTabs);
