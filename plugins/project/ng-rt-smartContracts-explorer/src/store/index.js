import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    toasts: [],
  },
  mutations: {
    addToast(state, payload) {
      state.toasts.push(payload);
    },
    setInfo(state, info) {
      state.info = info;
    },
  },
  actions: {},
  modules: {},
  getters: {
    getInfo(state) {
      return state.info;
    },
  },
});
