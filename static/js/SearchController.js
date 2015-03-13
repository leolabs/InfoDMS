/**
 * Created by leobernard on 06/03/15.
 */

angularApp.controller('SearchController', function($scope, $http, $routeParams) {
    $http.get("/api/documents_search/?q=" + $routeParams.query)
        .success(function(res) {
            $scope.documents = res;
        });
});