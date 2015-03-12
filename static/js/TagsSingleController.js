/**
 * Created by leobernard on 06/03/15.
 */

angularApp.controller('TagsSingleController', function($scope, $http, $routeParams) {
    $http.get("/api/documents/?tags=" + $routeParams.tag)
        .success(function(docs) {
            $scope.documents = docs;
        });
});