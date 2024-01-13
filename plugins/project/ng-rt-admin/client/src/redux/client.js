'use strict';

/* global window */
/* global Redux */
/* global ReduxThunk */
/* global combinedReducers */
/* global PolymerRedux */

const createStore = Redux.createStore;
const applyMiddleware = Redux.applyMiddleware;
const STORE = applyMiddleware(ReduxThunk.default)(createStore)(combinedReducers);
const polymerRedux = PolymerRedux;
window.ReduxBehavior = polymerRedux(STORE);
