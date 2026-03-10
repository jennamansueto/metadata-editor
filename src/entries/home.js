import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import axios from 'axios';
import VueI18n from 'vue-i18n';
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
window.jQuery = jQuery;
window.$ = jQuery;

// Install plugins
Vue.use(Vuex);
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

// Import project components
import ProjectShare from '@views/project/vue-project-share-component.js';
import CollectionRemove from '@views/project/vue-collection-remove-component.js';
import ProjectTagsManageDialog from '@views/project/vue-project-tags-manage-dialog-component.js';
import CollectionShare from '@views/project/vue-collection-share-component.js';
import ProjectAccess from '@views/project/vue-project-access-component.js';
import TransferOwnership from '@views/project/vue-transfer-ownership-component.js';
import LoginComponent from '@views/metadata_editor/vue-login-component.js';
import CreateRevision from '@views/project/vue-create-revision-component.js';
import ListRevisions from '@views/project/vue-list-revisions-component.js';
import UserFilter from '@views/project/vue-user-filter-component.js';
import TagFilter from '@views/project/vue-tag-filter-component.js';

// Register all components globally
Vue.component('alert-dialog', AlertDialog);
Vue.component('confirm-dialog', ConfirmDialog);
Vue.component('vue-global-site-header', GlobalSiteHeader);
Vue.component('main-navigation-tabs', MainNavigationTabs);
Vue.component('vue-project-share', ProjectShare);
Vue.component('vue-collection-remove-dialog', CollectionRemove);
Vue.component('vue-project-tags-manage-dialog', ProjectTagsManageDialog);
Vue.component('vue-collection-share', CollectionShare);
Vue.component('vue-project-access-dialog', ProjectAccess);
Vue.component('vue-transfer-ownership', TransferOwnership);
Vue.component('v-login', LoginComponent);
Vue.component('vue-create-revision-dialog', CreateRevision);
Vue.component('vue-list-revisions', ListRevisions);
Vue.component('vue-user-filter', UserFilter);
Vue.component('vue-tag-filter', TagFilter);
