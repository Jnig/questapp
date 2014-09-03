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
  })
.directive('autoGrow', function() {
  return function(scope, element, attr){
    var minHeight = element[0].offsetHeight,
      paddingLeft = element.css('paddingLeft'),
      paddingRight = element.css('paddingRight');
 
    var $shadow = angular.element('<div></div>').css({
      position: 'absolute',
      top: -10000,
      left: -10000,
      width: element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0),
      fontSize: element.css('fontSize'),
      fontFamily: element.css('fontFamily'),
      lineHeight: element.css('lineHeight'),
      resize:     'none'
    });
    angular.element(document.body).append($shadow);
 
    var update = function() {
      var times = function(string, number) {
        for (var i = 0, r = ''; i < number; i++) {
          r += string;
        }
        return r;
      }
 
      var val = element.val().replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/\n$/, '<br/>&nbsp;')
        .replace(/\n/g, '<br/>')
        .replace(/\s{2,}/g, function(space) { return times('&nbsp;', space.length - 1) + ' ' });
      $shadow.html(val);
 
      element.css('height', Math.max($shadow[0].offsetHeight + 10 /* the "threshold" */, minHeight) + 'px');
    }
 
    element.bind('keyup keydown keypress change', update);
    update();
  }
})
.directive('popup', function () {
        return {
                restrict: 'E',
                link: function (scope, elem, attrs) {

                        elem.on('click', function () {
                                                console.log(elem);
                                window.open(attr.href, 'Share', 'width=600,height=400,resizable=yes');
                        });
                }
        };
});
;