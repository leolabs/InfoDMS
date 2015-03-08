/**
 * Created by leobernard on 06/03/15.
 */

angularApp.controller('HomeController', function($scope, $rootScope, $http) {
    $scope.latestDocuments = null;
    $scope.documentStats = null;
    $scope.tagStats = null;
    $scope.typeStats = null;

    $http.get("/api/documents/latest/20")
        .success(function(res) {
            $scope.latestDocuments = res;
        })
        .error(function(res) {
            $scope.latestDocuments = undefined;
        });

    $http.get("/api/documents/stats")
        .success(function(res) {
            $scope.latestDocuments = res;
        })
        .error(function(res) {
            $scope.latestDocuments = undefined;
        });
});