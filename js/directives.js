angular.module('starter.directives', [])
  .controller('SelectCtrl', ['$scope', 'Restangular', '$timeout', '$document', function($scope, Restangular, $timeout, $document) {

    
        $scope.refreshAddresses = function (address) {
            Restangular.all('cities').getList({q: address}).then(function(cities){
                $scope.addresses =  cities;
            });
        };
        console.log($scope.placeholder);

    
  }])
  .directive('qselect', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/select.html',
        link: function( scope, element, attrs ) {
            console.log(element);
        },
        compile: function compile(tElement, tAttrs, transclude) {
            console.log(tElement);
            console.log(tAttrs);
            console.log(transclude);
          return {
            pre: function preLink(scope, iElement, iAttrs, controller) {
                         
            },
            post: function postLink(scope, iElement, iAttrs, controller) {
                
            }
          }
        }
    };
  });