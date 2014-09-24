(function(window, angular, undefined) {

'use strict';

angular.module('ehealth.couch-auth', []).
  .constant('ehealth.couch-auth.config', {
      databaseName: '',
  })
 .provider('ehealth.couch-auth.config', function () {
    // default values
    var values = {
      dbUrl: null
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
  .factory('couchdb', ['$resource', 'ehealth.couch-auth.config', function ($resource, SETTINGS) {
    return $resource(SETTINGS.dbUrl + ':_db/:_action/:_param/:_sub/:_sub_param',
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
      });
}]);

angular.module('ehealth.couch-auth')
  .constant('AUTH_EVENTS', {
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
});

angular.module('ehealth.couch-auth')
  .factory('Auth', function Auth($sessionStorage, couchdb, $rootScope, $q, AUTH_EVENTS) {

    function set(user) {
      if (user !== self.currentUser) {
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

        return couchdb.login(params).$promise
          .then(function(res) {
            if (res.ok) {
              set(user);
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
        return couchdb.logout().$promise
          .then(function(res) {
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
  });

})(window, window.angular);