'use strict';

/* global window */
/* global project */
/* global STORE */

(function() {
  const {
    GET_LOGS
    // GET_LOG
  } = window.actionTypes;

  const pajax = project.ajax;

  window.actions = window.actions || {};
  window.actions.logViewer = {
    getLogs: function(limit, skip) {
      let logViewer = STORE.getState().logViewer;
      limit = limit || logViewer.limit || 100;
      skip = skip || logViewer.skip || 0;
      const filters = logViewer.filters || {};
      const where = {};

      const filtering = {
        category: category => {
          where.categoryName = {regexp: '.*' + category + '.*'};
        },
        levelStr: levelStr => {
          where.levelStr = {regexp: '.*' + levelStr + '.*'};
        },
        data: data => {
          where.data = {regexp: '.*' + data + '.*'};
        },
        levelMax: levelMax => {
          where.level = where.level || {};
          if (levelMax)
            where.level = Object.assign(where.level, {lt: levelMax + 1});
          else
            delete where.level.lt;
        },
        levelMin: levelMin => {
          where.level = where.level || {};
          if (levelMin)
            where.level = Object.assign(where.level, {gt: levelMin - 1});
          else
            delete where.level.gt;
        },
        dateMax: dateMax => {
          where.startTime = Object.assign(where.startTime || {}, {lt: Date.parse(dateMax) + 1});
        },
        dateMin: dateMin => {
          where.startTime = Object.assign(where.startTime || {}, {gt: new Date(dateMin) - 1});
        },
        clientId: id => {
          where.clientId = {regexp: '.*' + id + '.*'};
        },
        sessionId: id => {
          where.sessionId = {regexp: '.*' + id + '.*'};
        }
      };

      Object.keys(filters).forEach(k => {
        if (filters[k] && filtering.hasOwnProperty(k))
          filtering[k](filters[k]);
      });

      const paramsLog = {limit, skip, where};
      const paramsLogCount = {where};

      // being used because the backend code is shifted to new backend plugin
      const namespace = "ng-admin-logviewer";

      return function(dispatch) {
        return Promise.all([
          pajax.post(`/${namespace}/log`, paramsLog),
          pajax.post(`/${namespace}/logCount`, paramsLogCount)
        ])
          .then(res => {
            dispatch({
              type: GET_LOGS,
              payload: {
                logs: res[0].result,
                count: res[1].result.count
              }
            });
            dispatch(window.actions.logViewer.filterLogs());
          });
      };
    },

    setFilters: function(filters) {
      return function(dispatch) {
        dispatch({
          type: 'SET_FILTERS',
          payload: {
            filters
          }
        });
        dispatch(window.actions.logViewer.getLogs());
      };
    },

    changeSort: function() {
      let {filteredLogs = [], sort} = STORE.getState().logViewer;
      sort = !sort;
      filteredLogs.sort((a, b) => sort ? Date.parse(b.timestamp) - Date.parse(a.timestamp) :
        Date.parse(a.timestamp) - Date.parse(b.timestamp));
      return {
        type: 'CHANGE_SORT',
        payload: {sort, filteredLogs}
      };
    },

    filterLogs: function(filters) {
      let logViewer = STORE.getState().logViewer;
      let filteredLogs = logViewer.logs || [];

      return {
        type: 'FILTER_LOGS',
        payload: {
          filteredLogs
        }
      };
    }
  };
})();
