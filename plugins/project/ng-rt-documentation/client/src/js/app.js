/* eslint strict: [2, "global"]*/

"use strict";

(function() {
  /* global Polymer */
  /* global app */
  /* global ajax */

  /* eslint new-cap: ["error", { "capIsNewExceptionPattern": "^Polymer" }] */

  Polymer({
    is: 'ng-rt-documentation',
    properties: {
      docs: [],
      title: ''
    },
    ready: function ready() {
      this.getDocs();
    },
    getDocs: function getDocs() {
      var self = this;

      // Get props from url
      var props = JSON.parse(app.pluginroute.props);
      var title = props.title;
      var folder = props.folder.replace('.', '/');

      // Set page title
      self.set('title', title);

      ajax.get('/ng-rt-core/plugins/docs?folder=' + folder, {}, function(response, xhr) {
        if (xhr.status != 200) return console.error(xhr); // eslint-disable-line no-console
        var docs = response;
        docs = docs.map(function(doc) {
          var link;

          switch (folder) {
            case 'api':
              link = `/ng-rt-core/docs/api/${doc}/index.html`;
              break;
            case 'guides':
              link = `/ng-rt-core/docs/guides/${doc}/html/index.html`;
              break;
            case 'userguides/admin':
              link = `/ng-rt-core/docs/userguides/admin/${doc}/html/index.html`;
              break;
            case 'userguides/enduser':
              link = `/ng-rt-core/docs/userguides/enduser/${doc}/html/index.html`;
              break;
            default:
              link = 'n/a';
              break;
          }

          return {
            name: doc,
            link: link
          };
        });

        // Set docs
        self.set('docs', docs);
      });
    }
  });
}).call(this);
