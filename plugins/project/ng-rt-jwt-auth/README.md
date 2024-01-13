Branch    | Pipeline | Coverage
----------|----------|----------
Dev/2.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-jwt-auth/badges/dev/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-auth/commits/dev/2.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-jwt-auth/badges/dev/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-auth/commits/dev/2.0)
Cons/2.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-jwt-auth/badges/cons/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-auth/commits/cons/2.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-jwt-auth/badges/cons/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-auth/commits/cons/2.0)
Prod/2.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-jwt-auth/badges/prod/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-auth/commits/prod/2.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-jwt-auth/badges/prod/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-auth/commits/prod/2.0)



## JWT Authentication routes
This extension creates the JSON Web Token aka JWT.  The JWT is being created after successful authentication of the User. The JWT contains authorization information about the role of the users, session information like rememberMe , session Time, trust_level, Universal second factor aka U2F.

It's optional plugin to be installed on ng-rt login server only.

Routes:

- signup
- login
- u2f
- logout
- change password
- forgot password

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-rt-jwt-auth**) and run
```
depcheck
```

Currently, this plugin contains the following unused dependencies:
```
Unused dependencies
* hot-shots
Unused devDependencies
* del
```

