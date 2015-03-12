/**
 * Created by leobernard on 06/03/15.
 */

angularApp.controller('MainController', function($scope, $rootScope, $http, $routeParams, $location) {
    $rootScope.main = {searchterm: $routeParams.query || ""};

    $rootScope.openSearch = function(searchterm) {
        $location.url("/search/" + searchterm);
    }
});