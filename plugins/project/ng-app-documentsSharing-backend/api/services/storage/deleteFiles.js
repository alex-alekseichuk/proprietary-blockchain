"use strict";

const rethinkConnection = require("rethinkdb");

const Promise = require("bluebird");

module.exports = (services, models, projectName, done) => {
  const rethinkdb = services.get('rethinkdb');
  const blockchain = services.get('blockchain');
  const configService = services.get("configService");

  const project = models.project;

  var connection = null;

  let fileIds = [];

  return project.findOne({
    where: {
      name: projectName
    }
  }).then(project => {
/*
    if (!project || !project.id)
    {
        done(true);
        return true;
    }
*/
    var projectId = project.id;

    rethinkdb.find({filter: function(r, query) {
      return query.filter(r.row('block')('transactions').contains(tx => {
        return tx('asset')('data')('project_id').eq(projectId.toString());
      }));
    }}).then(result => {
      result.forEach(elem => {
        let transactions = elem.block.transactions;

        let tx = transactions[0];

        let file = tx.asset.data;

        let fileId = file.fileId;

        fileIds.push(fileId);
      });

      rethinkConnection.connect({
        host: configService.get("rethinkHost"),
        port: configService.get("rethinkPort")
      }, (err, conn) => {
        if (err) {
          throw err;
        }

        connection = conn;

        return rethinkConnection
          .db("files")
          .table("fs_files")
          .filter(file => rethinkConnection.expr(fileIds).contains(file("metadata")("fileId")))
          .delete()
          .run(connection, result => Promise.resolve(result));
      });
    }).then(result => {
      if (fileIds.length > 0) {
        var record = {
          deletedFiles: fileIds
        };

        var tx = blockchain.createTx(record, configService.get("keypair.public"), configService.get("keypair.private"));

        return blockchain.postTxRecord(tx, function(result) {
          Promise.resolve(true);
        });
      }

      return true;
    }).then(result => {
      done(true);
    });
  });
};
