import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify';
import axios from 'axios';
import VueI18n from 'vue-i18n';
import Sortable from 'sortablejs';
import draggable from 'vuedraggable';
import _ from 'lodash';

// Make globals available
window.Vue = Vue;
window.Vuex = Vuex;
window.axios = axios;
window._ = _;
window.Vuetify = Vuetify;
window.VueI18n = VueI18n;
window.Sortable = Sortable;
window.draggable = draggable;

// Install plugins
Vue.use(Vuex);
Vue.use(Vuetify);
Vue.use(VueI18n);

// Import template_manager components
import FieldKey from '@views/template_manager/vue-field-key-component.js';
import FieldCustomKey from '@views/template_manager/vue-field-custom-key-component.js';
import PropKey from '@views/template_manager/vue-prop-key-component.js';
import TreeComponent from '@views/template_manager/vue-tree-component.js';
import TreeField from '@views/template_manager/vue-tree-field-component.js';
import TableGrid from '@views/template_manager/vue-table-grid-component.js';
import ValidationRules from '@views/template_manager/vue-validation-rules-component.js';
import PropEdit from '@views/template_manager/vue-prop-edit-component.js';

// Register components globally
Vue.component('vue-key-field', FieldKey);
Vue.component('vue-custom-key-field', FieldCustomKey);
Vue.component('vue-prop-key-field', PropKey);
Vue.component('nada-treeview', TreeComponent);
Vue.component('nada-treeview-field', TreeField);
Vue.component('table-grid-component', TableGrid);
Vue.component('validation-rules-component', ValidationRules);
Vue.component('prop-edit', PropEdit);
Vue.component('draggable', draggable);
