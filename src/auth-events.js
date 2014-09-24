'use strict';

angular.module('ehealth-couchdb-auth')
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
