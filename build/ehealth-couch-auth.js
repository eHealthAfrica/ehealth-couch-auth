(function(window, angular, undefined) {
  'use strict';

  angular.module('ehealth.couch-auth', [])
    .value('config', {
        values: {},
    })
  .provider('couchAuth', function () {
    // default values
    var values = {
      dbUrl: null,
      dbName: null
    };
    return {
      set: function (constants) {
        angular.extend(values, constants);
      },
      $get: function () {
        return values;
      }
    };
  })
  .factory('couchdb', ['$resource', 'couchAuth', function ($resource, couchAuth) {
    return $resource(couchAuth.dbUrl + ':_db/:_action/:_param/:_sub/:_sub_param',
      {
        _db: '@_db'
      },
      {
        session: {
          method: 'GET',
          withCredentials: true,
          params: {
            _db: '_session'
          }
        },
        put: {
          method: 'PUT',
          withCredentials: true
        },
        post: {
          method: 'POST',
          withCredentials: true
        },
        view: {
          method: 'GET',
          withCredentials: true,
          params: {
            _action: '_design',
            _sub: '_view'
          }
        },
        get: {
          method: 'GET',
          withCredentials: true
        },
        login: {
          method: 'POST',
          withCredentials: true,
          params: {
            _db: '_session'
          }
        },
        logout: {
          method: 'DELETE',
          withCredentials: true,
          params: {
            _db: '_session'
          }
        }
      }
    );
  }]).constant('AUTH_EVENTS', {
    login: {
      success: 'auth-login-success',
      failure: 'auth-login-failure'
    },
    logout: {
      success: 'auth-logout-success',
      failure: 'auth-logout-failure'
    },
    authenticated: {
      success: 'auth-authenticated-success',
      failure: 'auth-authenticated-failure'
    }
  }).factory('Auth', ['couchAuth', 'couchdb', 'AUTH_EVENTS', '$sessionStorage', '$rootScope', '$q',
                      function Auth(couchAuth, couchdb, AUTH_EVENTS, $sessionStorage, $rootScope, $q) {

    function set(user) {
      if (user !== self.currentUser) {
        if (user) {
          delete user.password;
        }
        self.currentUser = user;
        $sessionStorage.user = user;
      }
    }

    var self = this;

    self.currentUser = null;

    if ($sessionStorage.user) {
      set($sessionStorage.user);
    }

    return {
      /**
       * Authenticate user
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function(user) {
        user = user || {
          username: '',
          password: ''
        };

        var params = {
          name: user.username,
          password: user.password
        };

        return couchdb.login(params).$promise.then(function(res) {
            if (res.ok) {
              // Check next if allowed to connect to application database
              return couchdb.get({_db: couchAuth.dbName}).$promise.then(function(res) {
                set(user);
                return $rootScope.$broadcast(AUTH_EVENTS.login.success);
              });
            }
            else {
              return $rootScope.$broadcast(AUTH_EVENTS.login.success);
            }

            $rootScope.$broadcast(AUTH_EVENTS.login.failure);
          })
          .catch(function() {
            $rootScope.$broadcast(AUTH_EVENTS.login.failure);
          });
      },

      /**
       * Unauthenticate user
       *
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      logout: function() {
        return couchdb.logout().$promise.then(function(res) {
            if (res.ok) {
              set(null);
              return $rootScope.$broadcast(AUTH_EVENTS.logout.success);
            }
            $rootScope.$broadcast(AUTH_EVENTS.logout.failure);
          })
          .catch(function() {
            $rootScope.$broadcast(AUTH_EVENTS.logout.failure);
          });
      },

      /**
       * Returns current user
       *
       * @return {Object} user
       */
      currentUser: function() {
        return self.currentUser;
      },

      isAuthenticated: function() {
        var deferred = $q.defer();
        if (self.currentUser !== null) {
          deferred.resolve(AUTH_EVENTS.authenticated.success);
        } else {
          deferred.reject(AUTH_EVENTS.authenticated.failure);
        }
        return deferred.promise;
      }
    };
  }]).factory('authErrorInterceptor', ['$injector', '$q', function authErrorInterceptor($injector, $q) {
    return {
      'responseError': function(error) {
        // Auth has to be injected here to avoid circular dependencies
        var Auth = $injector.get('Auth');
        if (error.status === 401) {
          Auth.logout();
        }
        return $q.reject(error);
      }
    }
  }]).config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('authErrorInterceptor');
  }]);
})(window, window.angular);
