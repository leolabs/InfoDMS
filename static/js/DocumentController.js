/**
 * Created by leobernard on 06/03/15.
 */

angularApp.controller('DocumentController', function($scope, $rootScope, $http, $routeParams, $modal) {
    $scope.document = null;
    $scope.iframeURL = "/api/documents/" + $routeParams.id + "/data";
    $scope.advanced = false;

    $scope.openDocumentTypeSelector = function(doc) {
        var modalInstance = $modal.open({
            templateUrl: '/templates/typeselector.html',
            controller: 'TypeSelectorController',
            resolve: {
                document: function () {
                    return doc;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.document.type = selectedItem;
        });
    };

    $http.get("/api/documents/" + $routeParams.id)
        .success(function(res) {
            $scope.document = res;

            if(!$scope.document.type) {
                console.log("Should open modal");
                $scope.openDocumentTypeSelector(res);
            }
        });
});

angularApp.controller("TypeSelectorController", function($scope, $http, $modalInstance, document) {
    $scope.types = [{type: "Loading..."}];
    $scope.selectedName = document.type;
    $scope.okText = "OK";

    $scope.select = function(type) {
        $scope.selectedName = type.type;
    };

    $scope.ok = function () {
        if($scope.okText == "OK") {
            $scope.okText = "Improving Database...";

            $http.get("/api/analyzer/addToDatabase/" + document._id + "/" + $scope.selectedName)
                .success(function(res){
                    $scope.okText = "Saving changes...";

                    $http.put("/api/documents/" + document._id, {type: $scope.selectedName})
                        .success(function(res2) {
                            $modalInstance.close($scope.selectedName);
                        })
                })
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $http.get("/api/analyzer/guessType/" + document._id)
        .success(function(res) {
            $scope.types = res;

            if(!$scope.selectedName) {
                $scope.selectedName = res[0].name;
            }
        })
        .error(function(res) {
            $scope.types = [{type: "Failed to load types."}];
        });
});