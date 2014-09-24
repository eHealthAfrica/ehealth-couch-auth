'use strict';

angular.module('ehealth-couchdb-auth')
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
