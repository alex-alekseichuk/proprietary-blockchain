import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "vue-material-design-icons/styles.css";

import VueToast from "vue-toast-notification";
import "vue-toast-notification/dist/theme-default.css";

Vue.config.productionTip = false;

import MenuIcon from "vue-material-design-icons/Menu";
import ArrowLeft from "vue-material-design-icons/ArrowLeft";
import ArrowRight from "vue-material-design-icons/ArrowRight";
import Close from "vue-material-design-icons/Close";
import Tune from "vue-material-design-icons/Tune";
import Search from "vue-material-design-icons/DatabaseSearch";
import FunctionIcon from "vue-material-design-icons/Function";
import ChevronRight from "vue-material-design-icons/ChevronRight";

import InformationOutline from "vue-material-design-icons/InformationOutline";

Vue.component("menu-icon", MenuIcon);
Vue.component("arrow-left", ArrowLeft);
Vue.component("arrow-right", ArrowRight);
Vue.component("close", Close);
Vue.component("search", Search);
Vue.component("tune", Tune);
Vue.component("function", FunctionIcon);
Vue.component("chevron-right", ChevronRight);
Vue.component("information-outline", InformationOutline);

/* eslint-disable */
Vue.prototype.$project = project;
/* eslint-enable */

Vue.use(VueToast, {
  // One of options
  position: "bottom",
});

new Vue({
  router,
  store,

  render: (h) => h(App),
}).$mount("#app");
