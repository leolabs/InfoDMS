/**
 * Created by leobernard on 10/03/15.
 */
angularApp.directive('listDocument', function(){
        return {
            restrict: "E",
            scope: {
                documents: "="
            },
            templateUrl: '/templates/list-document.html',
            controller: function($rootScope, $scope){
                console.log($scope.documents);
            }
        }
    });