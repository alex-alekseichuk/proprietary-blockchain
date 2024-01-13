'use strict';

/* global window */

(function() {
  const {
    GET_LOGS,
    GET_LOG
  } = window.actionTypes;

  window.reducers = window.reducers || {};
  window.reducers.reducerLogViewer = function(state = {
    filters: {
      levelMin: 20000, levelMax: 30000,
      dateMin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
      dateMax: new Date(Date.now() + 1000 * 60 * 60 * 24)
    },
    sort: true
  }, action) {
    let newState = {};
    switch (action.type) {
      case GET_LOGS:
        Object.assign(newState, state, action.payload);
        break;
      case GET_LOG:
        Object.assign(newState, state);
        break;
      case 'FILTER_LOGS':
        Object.assign(newState, state, action.payload);
        break;
      case 'SET_FILTERS':
        Object.assign(newState, state, {filters: Object.assign((state.filters || {}), (action.payload.filters || {}))});
        break;
      case 'CHANGE_SORT':
        Object.assign(newState, state, action.payload);
        break;
      default:
        Object.assign(newState, state, action.payload);
    }
    return newState;
  };
})();
