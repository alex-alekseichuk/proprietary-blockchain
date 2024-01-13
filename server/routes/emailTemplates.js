'use strict';

const fs = require('fs-extra');

/**
 * API/Route/users
 *
 * @module API/Route/users
 * @type {Object}
 */

module.exports = server => {
  var EmailTemplates = server.models.emailTemplate;

  /**
   * Get a list of emailTemplates
   *
   *  it : https://gitlab.project.com/qa/it/raw/dev/3.0/tests/integration/ng-rt-core/routes_emailTemplates_test.js
   *
   * @name Get a list of emailTemplates
   * @route {GET} /${namespace}/emailTemplates
   * @authentication Requires valid session token via Role authentication
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.get("/emailTemplates", server.ensureLoggedIn(), (req, res) => {
    EmailTemplates.find().then(templates => {
      res.status(200).json(templates);
    }).catch(err => {
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });

   /**
   * Update of emailTemplates for SCUK
   *
   * @name Update of emailTemplates for SCUK
   * @route {POST} /${namespace}/emailTemplates
   * @bodyparam {String} body Text of the template
   * @bodyparam {String} templateId ID of the template
   * @authentication Requires valid session token via Role authentication
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.post("/emailTemplates", server.ensureLoggedIn(), (req, res) => {
    EmailTemplates.upsertWithWhere({
      id: req.body.templateId
    }, {
      body: req.body.body
    })
      .then(() => {
        res.json({
          sucess: true
        });
      })
      .catch(err => {
        res.status(500).json({
          success: false,
          error: err.message
        });
      });
  });

  server.post("/upload", server.ensureLoggedIn(), (req, res) => {
    let uPath = server.plugin_manager.configs.data('ng-rt-admin').path.relative + '/';
    fs.writeFile(uPath + req.headers.templateid + '_' + req.headers.name, new Buffer(req.body), err => {
      if (err) {
        return res.send({
          variant: "ERROR",
          result: err
        });
      }
      EmailTemplates.findOne({where: {id: req.headers.templateid}}).then(template => {
        var attachments = template.attachments;
        var newAttachment = {
          filename: req.headers.templateid + '_' + req.headers.name,
          path: uPath + req.headers.templateid + '_' + req.headers.name,
          cid: req.headers.templateid + '_' + req.headers.name
        };
        attachments.push(newAttachment);
        EmailTemplates.upsertWithWhere({
          id: req.headers.templateid
        }, {
          attachments: attachments
        })
        .then(() => {
          res.json({
            sucess: true
          });
        })
        .catch(err => {
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
      });
    });
  });

  server.post("/deleteAttachment", server.ensureLoggedIn(), (req, res) => {
    let uPath = server.plugin_manager.configs.data('ng-rt-admin').path.relative + '/';
    fs.unlink(uPath + req.body.filename, err => {
      if (err) {
        return res.send({
          variant: "ERROR",
          result: err
        });
      }
      EmailTemplates.findOne({where: {id: req.body.id}}).then(template => {
        var attachments = template.attachments;
        attachments = attachments.filter(function(elem) {
          return elem.filename != req.body.filename;
        });
        EmailTemplates.upsertWithWhere({
          id: req.body.id
        }, {
          attachments: attachments
        })
        .then(() => {
          res.json({
            sucess: true
          });
        })
        .catch(err => {
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
      });
    });
  });
};
