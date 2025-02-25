'use strict';

angular.module('gadgetinApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'restangular',
  'ngDialog',
  'smoothScroll',
  'angularMoment',
  'angularFileUpload'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider,
                    $httpProvider, RestangularProvider) {
    $urlRouterProvider
      .otherwise('/profile');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');
    RestangularProvider.setBaseUrl('/api');
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })

  .factory('authInterceptor', function ($rootScope, $q,
                                        $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })

  .run(function ($rootScope, $location, Auth, $state) {

    $rootScope.$state = $state;
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedIn(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  })
  .controller('IndexCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.scrollTopClick = function() {
      $window.scrollTo(0, 0);
    };
  }]);
