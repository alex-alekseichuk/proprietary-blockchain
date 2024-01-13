'use strict';
const configService = require('ng-configservice');
configService.read('config/server/config.json');

module.exports = server => {
  const url = configService.get('publicDNSName') || `http://${server.get('host')}:${server.get('port')}`;
  server.get(`/api-config`, (req, res) => {
    res.json({
      api: {
        auth: {baseURL: `${url}/`},
        keys: {baseURL: `${url}/`},
        menu: {baseURL: `${url}/`},
        demoTx: {baseURL: `${url}/`}
      },
      digitalAsset: {
        demoTx: 'bigchaindb2Official'
      }
    });
  });
  server.get(`/api-menu`, server.ensureLoggedIn(), (req, res) => {
    res.json({
      menu: [
        {title: 'Admin', url: '/admin/'},
        {title: 'Create TX', url: '/app-tx/#!/create/'},
        {title: 'Transfer TX', url: '/app-tx/#!/transfer/'}
      ]
    });
  });
};
