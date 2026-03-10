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
Vue.component('field-key', FieldKey);
Vue.component('field-custom-key', FieldCustomKey);
Vue.component('prop-key', PropKey);
Vue.component('tree-component', TreeComponent);
Vue.component('tree-field', TreeField);
Vue.component('table-grid', TableGrid);
Vue.component('validation-rules', ValidationRules);
Vue.component('prop-edit', PropEdit);
Vue.component('draggable', draggable);
