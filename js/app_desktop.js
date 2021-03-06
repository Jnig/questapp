
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', [ 'starter.controllers', 'starter.services', 'starter.directives', 'restangular', 'ui.select', 'ngSanitize', 'gettext', 'webStorageModule'])
        .value('isDesktop', 1).value('baseUrl', 'http://dev.questfeeding.com/')


.run(function(Restangular, EventService, AuthService, StartService, EventService) {
    StartService.desktop();
    EventService.start();
})

.config(function() {

})
.service('$state', function($window) {
    function handle(that, name, parameter) {
        if (name === 'app.success') {
            that.redirect('/success');
        } else if (name === 'app.quest') {
            that.redirect('/quest');
        } else if (name === 'tour.city') {
            that.redirect('/welcomecity');
        } else if (name === 'tour.topics') {
            that.redirect('/welcometopics');
        } else if (name === 'tour.quest') {
            that.redirect('/welcomequest');
        } else if (name === 'app.public') {
                that.redirect('/publicProfile?userId='+parameter['userId']+'&firstname='+parameter['firstname']);
        } else if (name === 'app.messages') {
            if (parameter['quest'] > 0) {
                that.redirect('/reply?quest=' + parameter['quest']);
            } else if (parameter['thread'] > 0) {
                that.redirect('/reply?thread=' + parameter['thread']);
            }

        }
    } 
    
    this.go = function (name, parameter) {
        handle(this, name, parameter);
    }
    
    this.transitionTo = function(name, parameter) {
        handle(this, name, parameter);
    };
    
    this.redirect = function(url) {
        $window.location = url; 
    };
    

  
})
.service('$ionicPopup', function() {
    

  
})
.service('$stateParams', function() {
    var objURL = new Object();
    
    window.location.search.replace(
        new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),

        function( $0, $1, $2, $3 ){
            objURL[ $1 ] = $3;
        }
    );
    
    for (var k in objURL){
        this[k] = objURL[k];
    }
  
})
.service('$ionicScrollDelegate', function() {
    this.scrollBottom = function() {
        
    }

  
})
.service('$cordovaPush', function() {
  
})
.service('$cordovaDevice', function() {
  
})
.service('$cordovaCamera', function() {
    
})
.service('$ionicLoading', function() {

    
    this.show = function() {
        //console.log('loading');
        $('body').prepend("<div id=\"loading\"><i class=\"icon ion-loading-c\"></i></div>");
    };
    
    this.hide = function() {
        $('#loading').remove();
    };
    
    
})
;

