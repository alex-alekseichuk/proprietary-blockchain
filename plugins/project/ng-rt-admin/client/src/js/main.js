"use strict" /* eslint-disable no-console */; // eslint-disable-line
/* global XMLHttpRequest */
/* global project */
/* global window */
/* global document */
/* global routeApp */
/* global I18nMsg */
/* global Platform */
/* global translate */ // eslint-disable-line
/* eslint-disable no-console */

(function(document) {
  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector("#app");

  app.authenticationSelected = 0;

  app.visible = "";

  app.domainSelected = "";

  if (!app.handleError) {
    app.handleError = function() {};
  }

  app.loadProfile = function() {
    var self = this;
    project.ajax.get("/user-profile", "ng-rt-jwt-auth", function(response, xhr) {
      if (!response) {
        self.handleError(xhr);
        return;
      }
      var user = response;
      self.username = user.username;
      self.email = user.email;
      self.phone = user.phone;
      self.emailVerified = user.emailVerified;
      self.phoneVerified = user.phoneVerified;
      self.advanced = user.advanced;
      self.domainId = user.domainId;
      app.domainSelected = user.domainId;

      window.selectedLanguage = user.defaultLocale;
      I18nMsg.lang = user.defaultLocale;
      I18nMsg.url = "/admin/ng-rt-admin/locales"; // optionally use custom folder for locales.
      Platform.performMicrotaskCheckpoint();
    });

    project.ajax.get("/availabledomains", {}, (response, xhr) => {
      if (!response) {
        self.handleError(xhr);
        return;
      }
      self.set("domains", response);
    });
  };
  window.onload = app.browserDetect;

  app.fileExists = function(url) {
    return new Promise(function(resolve, reject) {
      var http = new XMLHttpRequest();
      http.open("HEAD", url, true);
      http.onload = function() {
        if (http.status == 200) {
          resolve(http.response);
        } else {
          reject(http.statusText);
        }
      };
      http.onerror = function() {
        reject(http.statusText);
      };
      http.send();
    });
  };

  app.getThemeList = function(host) {
    if (!host) {
      host = window.location.hostname;
    }
    return project.ajax.get("../../themes/" + host + "/list.json").then(response => {
      if (!response) {
        // Load default list
        project.ajax.get("../../themes/project.com/list.json").then(response => {
          if (!response) {
            return false;
          }
          return response;
        });
      }
      return response;
    });
  };
  app.loadTheme = function(theme, host) {
    if (document.getElementById("vendorCSS")) {
      document.getElementById("vendorCSS").outerHTML = "";
    }
    if (!host) {
      host = window.location.hostname;
    }

    let relPath = "../../themes/" + host + "/" + theme + "/vendor.css";
    app
      .fileExists(relPath)
      .then(function() {
        app.appendStyle(host, theme);
      })
      .catch(function() {
        relPath = "../../themes/" + host + "/default/vendor.css";
        app
        .fileExists(relPath)
        .then(function() {
          app.appendStyle(host, "default");
        }).catch(function() {
          app.appendStyle();
        });
      });
  };
  app.appendStyle = function(host, theme) {
    let path = "/themes/" + host + "/" + theme + "/vendor.css";
    if (!theme || !host) {
      path = "/themes/project.com/default/vendor.css";
    }
    var fileref = document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("id", "vendorCSS");
    fileref.setAttribute("href", path);
    fileref.setAttribute("onerror", "this.onerror=null");
    document.getElementsByTagName("head")[0].appendChild(fileref);
    if (document.getElementById("curtain")) {
      window.setTimeout(() => {
        document.getElementById("curtain").style.height = "0";
      }, 1000);
    }
  };
  app.isVisible = function(visible, route) {
    return visible === route;
  };

  app.showAuthentication = function() {
    app.visible = "auth";
    app.authView = "sign";
  };

  app.showMain = function() {
    app.visible = "main";
  };

  app.showOtp = function() {
    app.visible = "auth";
    app.authView = "otp";
  };

  app.showForgotPassword = function() {
    app.visible = "auth";
    app.authView = "fp";
  };

  app.showResetPassword = function() {
    app.visible = "auth";
    app.authView = "rp";
  };

  project.ajax.on("401", function() {
    if (app.visible === 'auth')
      return;
    app.authenticationSelected = 0;
    app.showAuthentication();
  });

  project.ajax.on("200", function() {
    app.showMain();
  });

  project.ajax.on("otp", function() {
    app.showOtp();
  });

  project.ajax.on("fp", function() {
    app.showForgotPassword();
  });

  project.ajax.on("logout", function() {
    window.location = "/";
  });

  app.checkAccess = function(cb) {
    project.ajax._getAccessToken(function(code) {
      if (!code) {
        if (cb) cb();
      }
    });
  };

  // Show Toast
  app.notify = function(msg, type) {
    var toast;
    if (document.getElementById("simpletoast")) {
      toast = document.getElementById("simpletoast");
      if (type == "alert") toast = document.getElementById("alerttoast");
      else if (type == "stay") toast = document.getElementById("staytoast");
    }
    if (toast) {
      toast.show(msg);
    }
  };

  project.configService.init(function() {
    project.log4js.init().then(function() {
      project.ajax.initAuth();
      project.KeysService.init(function(err) {
        const toaster = document.getElementById("toaster");
        if (err) {
          if (err.message) toaster.show(err.message, "alert");
        }

        window.browserUtils.checkBrowser().catch(() => {
          toaster.show("Your browser is not compatible", "alert");
        });
      });
      routeApp(app);
    });
  });

  document.addEventListener("HTMLImportsLoaded", function() {
    app.loadProfile();
  });

  window.translate = function(arg) {
    return document.querySelector("i18n-msg").getMsg(arg) || arg;
  };
})(document);
