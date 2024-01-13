'use strict';

var logger = require('log4js').getLogger('email-send.js');

module.exports = function(EmailSend) {
  EmailSend.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance && ctx.instance) {
      var app = EmailSend.app;
      var service = global.serviceManager.get("unifiedMessaging.service");
      if (!service) {
        logger.error("No unified messaging service!");
        return;
      }
      if (ctx.instance.template) {
        logger.debug('send by template', ctx.instance.template);
        app.models.emailTemplate.findOne({where: {name: ctx.instance.template}}).then(template => {
          if (template) {
            ctx.instance.subject = template.subject;
            ctx.instance.date = new Date();
            service.mail.sendFromTemplate(ctx.instance.emails, template, ctx.instance.payload).then(result => {
              ctx.instance.sended = result.accepted;
              ctx.instance.result = result;
              next();
            }).catch(err => {
              ctx.instance.failed = true;
              ctx.instance.error = err;
              next();
            });
          } else {
            ctx.instance.failed = true;
            ctx.instance.error = new Error("Passed template don't found.");
            logger.error('Email Template not found');
            next();
          }
        }).catch(err => {
          ctx.instance.failed = true;
          ctx.instance.error = err;
          logger.error(err);
          next();
        });
      } else {
        logger.debug('send body');
        var result = service.mail.sendHtml(ctx.instance.emails, ctx.instance.subject, ctx.instance.body, ctx.instance.attachments);
        ctx.instance.sended = result.accepted;
        next();
      }
    } else next();
  });
};
