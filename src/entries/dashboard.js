import Vue from 'vue';
import Vuetify from 'vuetify';
import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';
import axios from 'axios';
import moment from 'moment';
import Chart from 'chart.js';

// Make globals available
window.Vue = Vue;
window.Vuetify = Vuetify;
window.VueI18n = VueI18n;
window.VueRouter = VueRouter;
window.axios = axios;
window.moment = moment;
window.Chart = Chart;

Vue.use(VueRouter);
