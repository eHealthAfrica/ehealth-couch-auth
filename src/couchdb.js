'use strict';

angular.module('ehealth-couchdb-auth')
  .factory('couchdb', ['$resource', 'SETTINGS', function ($resource, SETTINGS) {
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
