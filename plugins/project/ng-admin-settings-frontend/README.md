System settings for TBSP, accessed via sysadmin user.

This repo contains the frontend code and makes requests to the backend routes available in ng-admin-settings-backend.

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-admin-settings-frontend**) and run
```
depcheck
```

Currently, there are no unused dependencies in ng-admin-settings-frontend. 
