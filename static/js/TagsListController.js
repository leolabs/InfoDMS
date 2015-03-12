/**
 * Created by leobernard on 06/03/15.
 */

angularApp.controller('TagsListController', function($scope, $http) {
    $http.get("/api/tags/")
        .success(function(tags) {
            $scope.tags = tags;
        });
});