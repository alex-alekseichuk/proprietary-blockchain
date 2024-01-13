// <!--
// @license
// Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
// This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
// The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
// The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
// Code distributed by Google as part of the polymer project is also
// subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
// -->

'use strict';
/* eslint-disable*/ 
/* global page */
/* global app */
/* global window */
/* global project */
/* global Polymer */
/* global document */

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */


/**
 * @param {*} appl Application
 */
function routeApp(appl) {
  if (!appl)
    return;
  app.baseUrl = '/admin/';
  // We use Page.js for routing. This is a Micro
  // client-side router inspired by the Express router
  // More info: https://visionmedia.github.io/page.js/

  project.ajax.get('/admin/res/validationrules.json','ng-rt-admin', function(response,xhr) 
  {
    if(!response)

      window.project.rules=
      {
        username:"^[a-zA-Z0-9_\\-\\.]{4,}$",
        fullname:"^[a-zA-Z]{1,}([ -]{1}[a-zA-Z]{1,}){1,}$",
        decimalnumber:"^[\\-]?[0-9]+([.][0-9]+)?$",
        password:"^[a-zA-Z0-9$&*|#%@!?=_+\'.\'\'/\'\'(\'\')\'\'{\'\'}\']{6,}$",
        email:"^[a-zA-Z]{1,}[a-zA-Z0-9]*([_\\-\\.]{1}[a-zA-Z0-9]{1,})*@[a-zA-Z]{1,}[a-zA-Z0-9]*([\\-\\.]{1}[a-zA-Z0-9]{1,})*\\.[a-zA-Z]{1,4}$",
        phone:"^(\\+|[0]{1,2}){1}[1-9][0-9]{5,}$"
      };
    else
      window.project.rules=response
  });


  project.ajax.get('/admin/res/validationerrors.json','ng-rt-admin', function(response,xhr) 
  {
    if(!response)
      window.project.errors=
      {
        EN:
        {
          username:"At least a 4-char(letters/digits/-_.) long username.",
          fullname:"Enter Name and at least one Lastname",
          password:"At least 6-chars (letters/digits/$&*|#%@!?=_+./(){}) long pwd",
          phone:"Please enter a valid telephone number",
          decimalnumber:"Only decimal numbers allowed",
          email:"Please enter a valid email adress",
          confirm: "new password and confirmation does not match."
        }
      }
    else
      window.project.errors=response
  });

  
  // Routes

  appl.route = 'home';
  appl.routeformenu = 'home';
  appl.menuEmitter = new EventEmitter2();

  page('/forgot-password', function(ctx, next) {
    appl.showForgotPassword();
  });

  page('/login', function() {
    appl.showAuthentication();
  });

  page('/register', function() {
    appl.authenticationSelected = 1;
    appl.showAuthentication();
  });

  page('/reset-password/:accesstoken', function(ctx) {
    if (ctx.params.accesstoken)
      appl.rpAccessToken = ctx.params.accesstoken;
    appl.showResetPassword();
  });

  page('*', function(ctx, next) {
    appl.checkAccess(function() {
      appl.showMain();
    });
    next();
  });

  page('*', function(ctx, next) {
    appl.menuEmitter.emit('route', ctx);
    next();
  });

  // Middleware
  /**
   * @param {Object} ctx ctx
   * @param {Function} next next
   */
  function scrollToTop(ctx, next) {
    next();
  }

  /**
   * @param {Object} ctx ctx
   * @param {Function} next next
   */
  function closeDrawer(ctx, next) {
    appl.closeDrawer();
    next();
  }

  page(appl.baseUrl, function() {
    appl.route = 'home';
    appl.routeformenu = 'home';
  });

  page(appl.baseUrl + 'home', function() {
    appl.route = 'home';
    appl.routeformenu = 'home';
  });

  page(appl.baseUrl + 'keys', function() {
    appl.route = 'keys';
    appl.routeformenu = 'keys';
  });

  page(appl.baseUrl + 'keys/:token', function(data) {
    appl.route = 'keys';
    appl.routeformenu = 'keys';
    appl.params = data.params;
  });

  page(appl.baseUrl + 'users', function() {
    appl.route = 'users';
    appl.routeformenu = 'users';
  });

  page(appl.baseUrl + 'users/:name', function(data) {
    appl.route = 'user-info';
    appl.routeformenu = 'user-info';
    appl.params = data.params;
  });

  page(appl.baseUrl + 'contact', function() {
    appl.route = 'contact';
    appl.routeformenu = 'contact';
  });

  page(appl.baseUrl + 'profile', function() {
    appl.route = 'profile';
    appl.routeformenu = 'profile';
  });

  page(appl.baseUrl + 'securitykeys', function() {
    appl.route = 'securitykeys';
    appl.routeformenu = 'securitykeys';
  });

  page(appl.baseUrl + 'appkeys', function() {
    appl.route = 'appkeys';
    appl.routeformenu = 'appkeys';
  });

  page(appl.baseUrl + 'crud', function() {
    Polymer.dom(document.getElementById('crud-sm')).node.init();
    appl.route = 'crud';
    appl.routeformenu = 'crud';
  });

  page(appl.baseUrl + 'password', function() {
    appl.route = 'password';
    appl.routeformenu = 'password';
  });

  page(appl.baseUrl + 'upload', function() {
    appl.route = 'upload';
    appl.routeformenu = 'upload';
  });

  page(appl.baseUrl + 'treeview', function() {
    appl.route = 'treeview';
    appl.routeformenu = 'treeview';
  });

  page(appl.baseUrl + 'arubaform', function() {
    appl.route = 'arubaform';
    appl.routeformenu = 'arubaform';
  });

  page(appl.baseUrl + 'arubarequest', function() {
    appl.route = 'arubarequest';
    appl.routeformenu = 'arubarequest';
  });

  page(appl.baseUrl + 'arubavisa', function() {
    appl.route = 'arubavisa';
    appl.routeformenu = 'arubavisa';
  });

  page(appl.baseUrl + 'create-transaction', function() {
    appl.route = 'createtransaction';
    appl.routeformenu = 'createtransaction';
  });

  page(appl.baseUrl + 'acknowledgement', function() {
    appl.route = 'acknowledgement';
    appl.routeformenu = 'acknowledgement';
  });

  page(appl.baseUrl + 'systemsettings', function() {
    appl.route = 'systemsettings';
    appl.routeformenu = 'systemsettings';
  });

  page(appl.baseUrl + 'editterms', function() {
    appl.route = 'editterms';
    appl.routeformenu = 'editterms';
  });

  page(appl.baseUrl + 'search', function() {
    appl.route = 'search';
    appl.routeformenu = 'search';
  });

  page(appl.baseUrl + 'iframe/:routeformenu/:url', function(data) {
    appl.params = {url: decodeURI(data.params.url)};
    appl.route = 'iframe';
    appl.routeformenu = data.params.routeformenu;
  });

  page(appl.baseUrl + 'pluginsdisplay/:id', function(data) {
    project.ajax.get("/ng-rt-admin/routes?routeId=" + data.params.id, {}, function(data) {
      var url = data.href;
      var urls = url.split('/');

      appl.pluginroute = {
        view: urls[2],
        props: urls[3],
        url: urls[1]
      };

      appl.plugincaption = urls[6];
      appl.routeformenu = urls[4];
      appl.route = 'pluginsdisplay';
    });
  });

  page(appl.baseUrl + 'pluginsdisplay/:url/:view/:props/:pluginroute/:plugincaption', function(data) {
    appl.pluginroute = {
      view: data.params.view,
      props: data.params.props,
      url: data.params.url
    };
    appl.plugincaption = data.params.plugincaption;
    appl.routeformenu = data.params.pluginroute;
    appl.route = 'pluginsdisplay';
  });

  page(appl.baseUrl + 'logviewer', function() {
    appl.route = 'logviewer';
    appl.routeformenu = 'logviewer';
  });

  page(appl.baseUrl + 'emailTemplates', function() {
    appl.route = 'emailTemplates';
    appl.routeformenu = 'emailTemplates';
  });

  // 404
  page('*', function() {
    
    appl.route = 'home';
    appl.routeformenu = 'home';
  });

  // add #! before urls
  page({
    hashbang: true
  });

  /**
   * @param {Object} event event
   */
  function listener(event) {
    if (event.data === "HIDE_MENU") {
      var css = '#drawer{display:none!important}#main{left:0!important}';
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.body.appendChild(style);
    }
  }

  if (window.addEventListener) {
    window.addEventListener("message", listener, false);
  } else {
    window.attachEvent("onmessage", listener);
  }
} 
