var angularApp = angular.module('InfoDMS', ['ngRoute', 'ui.bootstrap']);

angularApp.config(function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: '/templates/homepage.html',
            controller: 'HomeController'
        }).
        when('/search/:query', {
            templateUrl: '/templates/search.html',
            controller: 'SearchController'
        }).
        when('/search/:query/:options', {
            templateUrl: '/templates/search.html',
            controller: 'SearchController'
        }).
        when('/tags', {
            templateUrl: '/templates/tags-list.html',
            controller: 'TagsListController'
        }).
        when('/tags/:tag', {
            templateUrl: '/templates/tags-single.html',
            controller: 'TagsSingleController'
        }).
        when('/types', {
            templateUrl: '/templates/types-list.html',
            controller: 'TypesListController'
        }).
        when('/types/:type', {
            templateUrl: '/templates/types-single.html',
            controller: 'TypesSingleController'
        }).
        otherwise({
            redirectTo: '/'
        });
    })

    .factory('loadingStatusInterceptor', function($q, $rootScope) {
        var activeRequests = 0;

        $rootScope.xhrLoading = false;

        var started = function() {
            if(activeRequests==0) {
                $rootScope.xhrLoading = true;
            }
            activeRequests++;
        };
        var ended = function() {
            activeRequests--;
            if(activeRequests==0) {
                $rootScope.xhrLoading = false;
            }
        };
        var error = function(rejection) {
            console.log(rejection);
            activeRequests--;
            if(activeRequests==0) {
                $rootScope.xhrLoading = false;
            }
        };
        return {
            request: function(config) {
                started();
                return config || $q.when(config);
            },
            response: function(response) {
                ended();
                return response || $q.when(response);
            },
            responseError: function(rejection) {
                error(rejection);
                return $q.reject(rejection);
            }
        };
    })

    .config(function($httpProvider) {
        $httpProvider.interceptors.push('loadingStatusInterceptor');
    })

    .directive('focus', function($timeout) {
        return {
            scope: {
                trigger : '@focus'
            },
            link: function(scope, element) {
                scope.$watch('trigger', function(value) {
                    $timeout(function() {
                        element[0].focus();
                    });
                });
            }
        };
    });