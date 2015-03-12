/**
 * Created by leobernard on 06/03/15.
 */

angularApp.controller('HomeController', function($scope, $rootScope, $http, $upload) {
    $scope.latestDocuments = null;
    $scope.documentStats = null;
    $scope.tagStats = null;
    $scope.typeStats = null;
    $scope.file = null;

    $scope.$watch('file', function(newVal) {
        console.log($scope.file);

        $upload.upload({
            url: "/api/documents",
            file: $scope.file,
            method: 'POST'
        }).progress(function(progress) {
            console.log(progress);
        }).success(function() {
            $scope.loadLatestDocs();
        })
    });

    $scope.loadLatestDocs = function() {
        $http.get("/api/documents/latest/20")
            .success(function(res) {
                $scope.latestDocuments = res;
            })
            .error(function(res) {
                $scope.latestDocuments = undefined;
            });

        $http.get("/api/documents/stats")
            .success(function(res) {
                $scope.documentStats = res;
            })
            .error(function(res) {
                $scope.documentStats = undefined;
            });
    };

    $scope.loadLatestDocs();
});