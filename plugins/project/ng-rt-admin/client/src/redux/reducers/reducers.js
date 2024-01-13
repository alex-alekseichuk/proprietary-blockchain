'use strict';

/* global window */

(function() {
  const combineReducers = window.Redux.combineReducers;

  window.combinedReducers = combineReducers({
    logViewer: window.reducers.reducerLogViewer
  });
})();
