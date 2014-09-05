angular.module('starter.controllers', [])

.controller('BodyCtrl', function($scope, $localStorage) {
    $scope.me = $localStorage.me;
    
    $scope.$on('me', function(event, data) {
        $scope.me = data;
    });
    

    $scope.unread = $localStorage.unread;
    
    $scope.$on('unread', function(event,data) {
        $localStorage.unread = data;
        
        $scope.unread = data;
        
    });
})

.controller('RegisterCtrl', function($scope, AuthService, $timeout, Restangular, $ionicLoading) {

    $scope.address = {};
    $scope.refreshAddresses = function (address) {
        Restangular.all('cities').getList({q: address, add: 'true'}).then(function(cities){
            $scope.addresses =  cities;
        });
    };
    
    $scope.register = function(user) {
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });
        user.city = $scope.address.selected.id;
        AuthService.register(user);
    };
})

/*****
 * LOGIN
 */
.controller('LoginCtrl', function($scope, AuthService, Restangular, $ionicLoading) {
    
    $scope.login = function(user) {
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });
        
        AuthService.login(user.email, user.password, 1);
    };
    
    $scope.forgotten = function(data) {
        Restangular.one('users', '').post('password_reset', data).then(function(){
        });
    };

})
/*****
 * CHATS
 */
.controller('ChatsCtrl', function( $scope, Restangular,$localStorage, $state, ReadService) {
    Restangular.all('threads').getList().then(function(threads) {
        $scope.threads = threads;
    })
    
    $scope.reply = function(thread) {
        ReadService.thread(thread.id);
        $state.go('app.messages', {thread: thread.id});
    }

})

/*****
 * MESSAGES
 */
.controller('MessagesCtrl', function( $scope, $stateParams, Restangular, $ionicScrollDelegate, $state, $sessionStorage, ReadService, AuthService, UploadService, $ionicLoading) {
    var threadId = $stateParams.thread;
    var questId = $stateParams.quest;
    $scope.messages = [];    
    $scope.user;
    
    UploadService.init(); 
    
    $scope.capture = function() {
        UploadService.capture();
    }
    
    $scope.$on('message', function(event,data) {
        if (data.thread.id === threadId) {
            ReadService.thread(data.thread.id);

            $scope.messages.push(data);

            $ionicScrollDelegate.scrollBottom();
        }
    });


    if (threadId > 0) {
        Restangular.one('threads', threadId).getList('messages').then(function(messages) {            
            $scope.messages = messages;
            
            for (var i = 0, len = messages.length; i < len; i++) {
                if(messages[i].user.id !== AuthService.get().id) {
                    $scope.user = messages[i].user;
                    break;
                }
            }
            
            $ionicScrollDelegate.scrollBottom();
        });
    } else {
        var quest = $sessionStorage.quest;

        ReadService.questForMe(quest.id);

        var message = {text: quest.text, user: quest.owner, attachment: quest.attachment, created: quest.created};
        $scope.messages.push(message);
    }
    
    
    $scope.send = function(message) {
        var imageData = UploadService.getImage();
        
        if (message.text.length === 0 && imageData.length === 0) { // do not allow empty message without attachment
            return;
        }
        
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });        

        if (imageData.length > 0 ) {
            message.attachmentFile = imageData;
        } 
        
        if (threadId > 0) {
            var rest = Restangular.one('threads', threadId).post('messages', message);
        } else {
            var rest = Restangular.one('quests_for_me', questId).post('answers', message);
        }
        
        rest.then(function(message) {
            if (!threadId) {
                $state.go("app.messages", {thread: message.thread.id});
            }
            $scope.messages.push(message);
            $scope.message.text  = '';
            UploadService.clear();
            
            $ionicScrollDelegate.scrollBottom();
            $ionicLoading.hide();
        }, function(error) {
            $ionicLoading.hide();
        });
        
        
    };

})

/*****
 * Facebook/Google login
 */
.controller('WelcomeCtrl', function( $scope, ConnectService) {
    $scope.facebook = function () {
        ConnectService.facebook();
    }
    
    $scope.google = function () {
        ConnectService.google();
    }
    
    $scope.link = {};
    $scope.link.terms = '<a href="http://www.questfeeding.com/terms" target="_blank">Terms of Use</a>' ;
    $scope.link.terms = '<a href="http://www.questfeeding.com/privacy" target="_blank">Privacy Policy</a>' ;
})


.controller('PlaylistCtrl', function($scope) {
})

.controller('BestquestsCtrl', function($scope, Restangular, $state) {
    Restangular.one('me', '').all('friends').getList().then(function(friends) {
       $scope.friends = friends;
    });
    
    $scope.public = function(friend) {
        $state.go('app.public', {userId: friend.id, firstname: friend.firstname})
    };
})

/*****
 * Quest Controller
 */
.controller('QuestCtrl', function($scope, Restangular, LanguageService, $state, $sessionStorage, AuthService, UploadService, $ionicLoading) {
    AuthService.finishUniRegister(); //check if register was over uni page; if yes finish register; quest is first page after register
    AuthService.dispatch(); // look for welcome tour

    $scope.quest = {};
    
    UploadService.init(); 
    
    $scope.capture = function() {
        UploadService.capture();
    }
    
    function send(quest) {
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });
        
        var a = ['topic', 'city', 'highschool', 'college', 'study', 'profession', 'company'];
        a.forEach(function(entry) {
            if (typeof $scope[entry].selected !== 'undefined') {
                quest[entry] = $scope[entry].selected.id;
            }
        });
        
        var imageData = UploadService.getImage();
        if (imageData.length > 0 ) {
            quest.attachmentFile = imageData;
        } 

        Restangular.all('quests').post(quest).then(function(response) {
            $ionicLoading.hide();
            
            if (response.id > 0 ) {
                $sessionStorage.quest = response;
                
                UploadService.clear();
                $state.go("app.success", {questId: response.id});
            } else {
                alert('error on sending quest');
            }
        }, function(error) {
            $ionicLoading.hide();
        });
    }
    
    
    $scope.send = function(quest) {
        var locale = LanguageService.detectLocale(quest.text);
        
        if (locale === 'unknown') {
            $scope.showLanguageNotFound = 1;
            return;
        } else {
            // display popup if language not in user languages
        }
        
        quest.language = locale;
        
        send(quest);
    };
    
    $scope.sendLanguage = function(quest) {
        if (angular.isDefined($scope.language.selected)) {
            quest.language = $scope.language.selected.locale;
            send(quest);
        }
    };


    function refresher(api) {
        return function (q) {
            if (q) {
                Restangular.all(api).getList({q: q}).then(function(response){
                    $scope[api] = response;
                });  
            } else {
                $scope[api] = [];
            }
            

        };
    };
    
    
    $scope.topic = {};

    $scope.city = {};
    $scope.highschool = {};
    $scope.college = {};
    $scope.study = {};
    $scope.profession = {};
    $scope.company = {};
    $scope.language = {};
    
    $scope.refreshTopics = refresher('topics');
    $scope.refreshCities = refresher('cities');
    $scope.refreshHighschools = refresher('highschools');
    $scope.refreshColleges = refresher('colleges');
    $scope.refreshStudies = refresher('studies');
    $scope.refreshProfessions = refresher('professions');
    $scope.refreshCompanies = refresher('companies');
    $scope.refreshLanguages = refresher('languages');
})

/*****
 * QuestSuccess Controller
 */
.controller('QuestSuccessCtrl', function($scope, Restangular, MapService, $sessionStorage, $ionicLoading) {

    
    var quest = $sessionStorage.quest;

    var questId = quest.id;
    
    MapService.create('success_worldmap');
    
    var firstReceiver = quest.receiver[0];
    $scope.firstname = firstReceiver.firstname;
    $scope.city = firstReceiver.city.name;
    
    MapService.addMarker('success_worldmap', firstReceiver.city.latitude, firstReceiver.city.longitude, firstReceiver.city.name);


    $scope.again = function() {
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });
        
        Restangular.one('quests', questId).all('receivers').post().then(function(response) {
            $ionicLoading.hide();
            if (response.hasOwnProperty('id')) {
                $scope.firstname = response.firstname;
                $scope.city = response.city.name;
                MapService.addMarker('success_worldmap', response.city.latitude, response.city.longitude, response.city.name);
            } else {
                $scope.noMatches = 1;
            }
        }, function(response) {
            $ionicLoading.hide();
        });

    };    

})

/*****
 * Topic Controller
 */
.controller('TopicCtrl', function($scope, Restangular) {
    Restangular.one('me', '').all('topics').getList().then(function(topics) {
        $scope.topicsList = topics;
    });
    
    
    $scope.topic = {};
    $scope.submit = function($item) {
        
        var topic = {id: $item.id,  name: $item.name}
        Restangular.one('me', '').all('topics').post(topic).then(function(response) {
            $scope.topicsList.unshift(response);
            $scope.topic.selected = undefined;
        });
    };
    
    $scope.delete = function(topic) {
        $scope.topicsList.splice( $scope.topicsList.indexOf(topic), 1 ); // remove element
        topic.remove();


    };
    
    
    
    $scope.refreshAddresses = function (address) {
        Restangular.all('attributes').getList({q: address, add: 'true'}).then(function(cities){
            $scope.topics =  cities;
        });
    };

})


/*****
 * Quests Controller (shows quests for me and by me
 */
.controller('QuestsCtrl', function($scope, Restangular, $state, $sessionStorage, ReadService) {
    Restangular.all('quests').getList().then(function(quests) {
        $scope.questsByMe = quests;
    });


    Restangular.all('quests_for_me').getList().then(function(quests) {
        $scope.questsForMe = quests;
    });
    
    $scope.reply = function(quest) {
        
        if (quest.answers.length > 0 ) {
            var threadId = quest.answers[0].message.thread.id;

            $state.go("app.messages", {thread: threadId});
        } else {
            $sessionStorage.quest = quest;
            $state.go("app.messages", {quest: quest.id});
        }

    };
    
    $scope.showAnswers = function(quest) {

        if (quest.answers.length > 0) {
            ReadService.quest(quest.id);
            $sessionStorage.quest = quest;
            $state.go("app.answers");
        }
    }
})

/**
 * Hangles logout requests
 */
.controller('LogoutCtrl', function($scope, AuthService, $state) {
    AuthService.logout();  

    $state.go("welcome");
})

/**
 * Public Profile
 * #/app/public/5?firstname=Jakob
 * id and firstname is necessary to get an api response. Otherwise it would be possible to loop through all ids and get all the user details
 */
.controller('PublicCtrl', function($scope, Restangular, $state, $localStorage, $stateParams) {

    var userId = $stateParams.userId;
    var firstname = $stateParams.firstname;
    Restangular.one('users', userId).get({firstname: firstname}).then(function(user) {
        $scope.user = user;
    });
    
    $scope.message = function(user) {
        $state.go('app.messages', {thread: user.id})
    };
    
    $scope.add = function(user) {
        var data = {id: user.id, firstname: user.firstname};
        Restangular.one('me', '').all('friends').post(data).get().then(function(friend) {
        });
    };

})

/**
 * Welcome controller
 */
.controller('WelcomeCityCtrl', function($scope, Restangular, $state, $localStorage, AuthService, $ionicLoading) {
    $scope.address = {};
    $scope.refreshAddresses = function (address) {
        Restangular.all('cities').getList({q: address, add: 'true'}).then(function(cities){
            $scope.addresses =  cities;
        });
    };
    
    $scope.submitCity = function() {
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });
        var user = {city: $scope.address.selected.id};
        
        Restangular.one('me', '').patch(user).get().then(function() {
            var me = AuthService.me();
            me.tour_city = false;
            $ionicLoading.hide();
            AuthService.dispatch(1);
        }, function() {
            $ionicLoading.hide();
        });

    };

})
/*****
 * Answers Controller
 */
.controller('AnswersCtrl', function($scope, Restangular, $sessionStorage, $state, ReadService) {
    var quest = $sessionStorage.quest;
    
    if(quest) {
        $scope.answers = quest.answers;
    }


    
    $scope.reply = function(answer) {
        $state.go('app.messages', {thread: answer.message.thread.id});
    }
    
})
/*****
 * Profile Controller
 */
.controller('ProfileCtrl', function($scope, Restangular, $sessionStorage, $state, AuthService, debounce) {
    var me = AuthService.get();
    
    $scope.gender = me.gender;
    $scope.relationship = me.relationship;

    $scope.days = [];
    for (var i = 1; i <= 31; i++) {
        $scope.days.push(i);
    }
    $scope.months = [];
    for (var i = 1; i <= 12; i++) {
        $scope.months.push(i);
    }
    $scope.years = [];
    for (var i = 1920; i <= new Date().getFullYear(); i++) {
        $scope.years.push(i);
    }
    
    $scope.dateOfBirth = me.birthday;

    
    function refresher(api, options) {
        var name = api + 'List';
        
        return function (q) {
            if (q) {
                Restangular.all(api).getList({q: q, add: 'true'}).then(function(response){
                    $scope[name] = response;
                });  
            } else {
                $scope[name] = [];
            }

        };
    };
    
    function patch(name, $item) {
        var object = {};
        
        if (name === '') {
            name = $item.route;
        }
        
        if (name === 'cities') {
            object['city'] = $item.id;
        } else if (name === 'dateOfBirth' || name === 'gender' || name === 'relationship' || name === 'about') {
            object[name] = $item;
        } else {
            object[name] = [{id: $item.id, name: $item.name}];
        }
        
        Restangular.one('me', '').patch(object).then(function() {
            Restangular.one('me', '').get().then(function(user) {
               AuthService.set(user);
            });
        });
    }
    

    var a = ["highschools", "colleges", "studies", "professions", "companies"];
    a.forEach(function(entry) {
        if (me[entry].length > 0){
            $scope[entry] = {selected : {name: me[entry][0].name}};
        }
        
    });
    
    //cities because  a other city variable is set in the app    
    $scope.cities = {selected : {name: me.city.name}};
    $scope.refreshCities = refresher('cities');
    $scope.refreshHighschools = refresher('highschools');
    $scope.refreshColleges = refresher('colleges');
    $scope.refreshStudies = refresher('studies');
    $scope.refreshProfessions = refresher('professions');
    $scope.refreshCompanies = refresher('companies');
    $scope.refreshLanguages = refresher('languages');

    $scope.changedCity = function($item) {
        patch('', $item);
    };
    
    $scope.changedHighschools = function($item) {
        patch('', $item);
    };
    
    $scope.changedColleges = function($item) {
        patch('', $item);
    };
    
    $scope.changedStudies = function($item) {
        patch('', $item);
    };
    
    $scope.changedProfessions = function($item) {
        patch('', $item);
    };
   
    $scope.changedCompanies = function($item) {
        patch('', $item);
    };
    
    $scope.changedBirthday = function(dateOfBirth) {
        if (Object.keys(dateOfBirth).length == 3 &&
                dateOfBirth.day !== null &&
                dateOfBirth.month !== null &&
                dateOfBirth.year !== null) {
            patch('dateOfBirth', dateOfBirth);
        }
    };
    
    $scope.changedGender = function(gender) {
        patch('gender', gender);
    };
    
    $scope.changedRelationship = function(relationship) {
        patch('relationship', relationship);
    };
    

    $scope.data = {about: me.about}; // WTF?!?! $scope.about doesn't work, needs object
    $scope.changedAbout = debounce(function () {
        patch('about', $scope.data.about);
    }, 1000);
    

})
/*****
 * Tour Controller
 */
.controller('TourCtrl', function($scope, Restangular, $sessionStorage, $state, AuthService, $ionicLoading, $q, LanguageService) {
    Restangular.all('topics').getList({welcome: true}).then(function(topics) {
        $scope.topicsList = topics;
    });
    
    $scope.topics = [];
    
    $scope.selectTopic = function(topic) {
        if($scope.topics[topic.id] === 1) {
            delete $scope.topics[topic.id];
        } else {
            $scope.topics[topic.id] = 1;
        }
    };
    

    $scope.submitTopics = function(){
        var promises = [];
        for(var key in $scope.topics){
            var topic = {id: key}
            promises.push(Restangular.one('me', '').all('topics').post(topic));
        }
        topics = [];
        
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });
        $q.all(promises).then(function() {

            var me = AuthService.me();
            me.tour_topics = false;
            
            $ionicLoading.hide();
            AuthService.dispatch(1);            
        }, function() {
            $ionicLoading.hide();
            AuthService.dispatch(1);
        });
    };
    
    
    $scope.quest = {};
    $scope.suggestQuest = function() {
        Restangular.one('quests_templates', '').get().then(function(questTemplate) {
            $scope.quest = {text: questTemplate.text, language: questTemplate.language.locale};
        });
    };
    $scope.suggestQuest();
    
    $scope.submitQuest = function(quest) {       
        if (quest.language === '') {
            quest.language = LanguageService.detectLocale(quest.text);

            if (quest.language === 'unknown') {
                var me = AuthService.me();
                quest.language = me.languages[0].locale;
            }
        }
        

        
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c"></i>'
        });


        Restangular.all('quests').post(quest).then(function(response) {
            $ionicLoading.hide();
            var me = AuthService.me();
            me.tour_quest = false;
            $sessionStorage.quest = response;
            $state.go("app.success", {questId: response.id});
        }, function(error) {
            $ionicLoading.hide();
        });
        


    };
    

    
})
/*****
 * Uni
 */
.controller('UniCtrl', function($scope, Restangular, $sessionStorage) {
    $scope.colleges = {};
    $scope.studies = {};
    
    function refresher(api, options) {
        var name = api + 'List';
        
        return function (q) {
            if (q) {
                Restangular.all(api).getList({q: q, add: 'true'}).then(function(response){
                    $scope[name] = response;
                });  
            } else {
                $scope[name] = [];
            }

        };
    };
    
    $scope.refreshColleges = refresher('colleges');
    $scope.refreshStudies = refresher('studies');
    
    $scope.changedColleges = function($item) {
        $sessionStorage.college = $item;
    };
    
    $scope.changedStudies = function($item) {
        $sessionStorage.study = $item;
    }
})
/*****
 * Settings Controller
 */
.controller('SettingsCtrl', function($scope, Restangular) {            
    $scope.displayPasswordSuccess = 0;
    $scope.changePassword = function(data) {
        Restangular.one('me', '').post('password', data).then(function(response) {
            $scope.displayPasswordSuccess = 1;
        });
    };    
})
/*****
 * Startup Controller
 */
.controller('StartupCtrl', function($scope) {
    
})
;