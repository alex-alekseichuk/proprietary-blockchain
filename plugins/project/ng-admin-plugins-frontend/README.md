Adds the U̶I̶, menu entry for Plugins for admin user.

The actual UI is in ng-polymer-admin instead of the included index.html. To make changes to the UI, make changes in ng-polymer-admin, build it and then build this plugin

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies



*  are used
*  are not used
*  are missing from package.json.

Install Depcheck



```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-admin-plugins-frontend**) and run
```
depcheck
```

Currently, there are no unused dependencies in ng-admin-plugins-frontend.
