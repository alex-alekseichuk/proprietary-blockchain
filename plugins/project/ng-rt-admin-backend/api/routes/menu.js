/**
 * Menu HTTP routes
 */
'use strict';
let logger = require('log4js').getLogger('routes/menu.js');

/**
 * API/Route/menu
 *
 * @module API/Route/menu
 * @type {Object}
 */
module.exports = {
  activate: server => {
    const menu = require('../services/menu')(server);

    /**
     * Gets the menu list items
     *
     * @name Gets the menu list items
     * @route {GET} /${namespace}/menu
     * @authentication Requires an valid Session Token
     *
     */
    server.get('/menu', server.ensureLoggedIn(), (req, res) => {
      var name = req.query.name;
      logger.trace("get menu");
      logger.trace(req.user);
      let ret = {
        items: [],
        favorites: [],
        profile: []
      };
      menu.getMenu(name, req.user).then(items => {
        ret.items = items;
        return menu.getFavorites(req.user);
      }).then(favorites => {
        if (favorites) {
          favorites.forEach(fav => {
            let added = false;
            ret.items.forEach(m => {
              if (!added)
                for (let i = 0, l = m.items.length; i < l; ++i) {
                  let item = m.items[i];
                  if (!added && item.type === fav.type && item.route === fav.route &&
                    item.module === fav.module && item.caption === fav.caption) {
                    added = true;
                    ret.favorites.push(item);
                  }
                }
            });
          });
        }
        return menu.getMenu(name, req.user, true);
      }).then(items => {
        items.forEach(item => {
          item.items.forEach(i => {
            ret.profile.push(i);
          });
        });
        res.send(ret);
      }).catch(err => {
        res.status(500).json(err).end();
      });
    });

    /**
     * Gets the favourites of a user
     *
     * @name Gets the favourites of a user
     * @route {GET} /${namespace}/menu/favorites
     * @authentication Requires an valid Session Token
     *
     */
    server.get("/menu/favorites", server.ensureLoggedIn(), (req, res) => {
      menu.getFavorites(req.user).then(favorites => {
        res.send(favorites);
      }).catch(err => {
        res.status(500).json(err).end();
      });
    });

    /**
     * Receive the favourites of a user
     *
     * @name Receive the favourites of a user
     * @route {POST} /${namespace}/menu/favorites
     * @authentication Requires an valid Session Token
     *
     */
    server.post("/menu/favorite", server.ensureLoggedIn(), (req, res) => {
      var item = req.body.route;
      menu.addFavorite(item, req.user).then(data => {
        res.send({});
      }).catch(err => {
        res.status(500).json(err).end();
      });
    });

    /**
     * Delete the favourites of a user
     *
     * @name Delete the favourites of a user
     * @route {DELETE} /${namespace}/menu/favorites
     * @authentication Requires an valid Session Token
     *
     */
    server.delete("/menu/favorite", server.ensureLoggedIn(), (req, res) => {
      var item = req.body.route;
      menu.removeFavorite(item, req.user).then(() => {
        res.send({});
      }).catch(err => {
        logger.error(err);
        res.status(500).json(err).end();
      });
    });
  },
  deactivate: {
    menu: '/menu',
    favorites: '/menu/favorites',
    updateFavorites: {
      path: '/menu/favorites',
      type: 'post'
    },
    deleteFavorites: {
      path: '/menu/favorites',
      type: 'delete'
    }
  }
};
