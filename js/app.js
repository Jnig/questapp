// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.directives', 'restangular', 'ngStorage', 'ui.select', 'ngCordova', 'gettext'])
        .value('isDesktop', 0)

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})
.run(function(Restangular, $localStorage, EventService, gettextCatalog) {
    gettextCatalog.setCurrentLanguage('de');
    if ($localStorage.dev == 1) {
        console.log('Using local dev api');
        apiUrl = 'http://quest.dev/v2';
    } else {
        apiUrl = 'http://dev.questfeeding.com/v2';
    }
    
    Restangular.setBaseUrl(apiUrl);
    
    if (typeof $localStorage.token !== 'undefined'  && $localStorage.token.length > 0) {
        Restangular.setDefaultRequestParams({apikey: $localStorage.token});
        EventService.start();
    }
    
    Restangular.all('languages').getList().then(function(languages) {
        $localStorage.languages = languages;
    });    
    
})
/**
 * Auth Service injection is necessary, otherwise events are not caught
 */
.run(function($rootScope, AuthService) {
    var scope = $rootScope;
    
    //AuthService.check();
    
    // when app it put in background
    document.addEventListener('pause', function() {
        scope.$broadcast('pause');
    }, false);

    // when app is restored from background
    document.addEventListener('resume', function() {
        scope.$broadcast('resume');
    }, false);
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('welcome', {
      url: "/welcome",
      templateUrl: "templates/welcome.html",
      controller: 'WelcomeCtrl'
    })

    .state('logout', {
      url: "/logout",
      controller: 'LogoutCtrl'
    })
    .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
      controller: 'LoginCtrl'
    })

    .state('forgot', {
      url: "/forgot",
      templateUrl: "templates/forgot.html",
      controller: 'LoginCtrl'
    })

    .state('register', {
      url: "/register",
      templateUrl: "templates/register.html",
      controller: 'RegisterCtrl'
    })

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html"
    })
    
    .state('app.quest', {
      url: "/quest",
      templateUrl: "templates/quest.html",
      controller: 'QuestCtrl'
    })
    
    .state('app.success', {
      url: "/success/:questId",
      templateUrl: "templates/quest_success.html",
      controller: 'QuestSuccessCtrl'
    })
    
    .state('app.forme', {
      url: "/forme",
          templateUrl: 'templates/forme.html',
          controller: 'QuestsCtrl'


    })

    .state('app.byme', {
      url: "/byme",

            templateUrl: 'templates/byme.html',
            controller: 'QuestsCtrl'


    })
    
    .state('app.answers', {
      url: "/answers",
      templateUrl: "templates/answers.html",
      controller: 'AnswersCtrl'
    })
    
    .state('app.chats', {
      url: "/chats",
      templateUrl: "templates/chats.html",
      controller: 'ChatsCtrl'
    })
    
    .state('app.messages', {
      url: "/messages?quest&thread",
      templateUrl: "templates/messages.html",
      controller: 'MessagesCtrl'
    })
    
    .state('app.bestquests', {
      url: "/bestquests",
      templateUrl: "templates/bestquests.html",
      controller: 'BestquestsCtrl'
    })

    .state('app.user', {
      url: "/user",
      abstract: true,
      templateUrl: "templates/user.html"
    })

    .state('app.user.topics', {
      url: '/topics',
      views: {
        'tab-topics': {
          templateUrl: 'templates/topics.html',
          controller: 'TopicCtrl'
        }
      }
    })

    .state('app.user.profile', {
      url: '/profile',
      views: {
        'tab-profile': {
          templateUrl: 'templates/profile.html',
          controller: 'ProfileCtrl'

        }
      }
    })

    .state('app.user.settings', {
      url: '/settings',
      views: {
        'tab-settings': {
          templateUrl: 'templates/settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })
    
    .state('app.public', {
      url: "/public/:userId?firstname",
      templateUrl: "templates/public.html",
      controller: 'PublicCtrl'
    })
    
    .state('tour', {
      url: "/tour",
      abstract: true,
      templateUrl: "templates/tour.html"
    })
    
    .state('tour.city', {
      url: "/city",
      templateUrl: "templates/tour_city.html",
      controller: 'TourCtrl'
    })
    
    .state('tour.topics', {
      url: "/topics",
      templateUrl: "templates/tour_topics.html",
      controller: 'TourCtrl'
    })
    
    .state('tour.quest', {
      url: "/quest",
      templateUrl: "templates/tour_quest.html",
      controller: 'TourCtrl'
    })
    
    .state('startup', {
      url: "/startup",
      templateUrl: "templates/startup.html",
      controller: 'StartupCtrl'
    })
    
    ;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/startup');
});

