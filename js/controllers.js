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

.controller('RegisterCtrl', function($scope, AuthService, $timeout, Restangular) {
    
    $scope.address = {};
    $scope.refreshAddresses = function (address) {
        Restangular.all('cities').getList({q: address, add: 'true'}).then(function(cities){
            $scope.addresses =  cities;
        });
    };
    
    $scope.register = function(user) {
        
        user.city = $scope.address.selected.id;
        AuthService.register(user);
    };
})

/*****
 * LOGIN
 */
.controller('LoginCtrl', function($scope, AuthService) {
    $scope.login = function(user) {
        AuthService.login(user.email, user.password, 1);
    }

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
.controller('MessagesCtrl', function( $scope, $stateParams, Restangular, $ionicScrollDelegate, $state, $sessionStorage, ReadService, AuthService, UploadService) {
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
    
    $scope.link.terms = '<a href="http://www.questfeeding.com/terms" target="_blank">Terms of Use</a>' ;
    $scope.link.terms = '<a href="http://www.questfeeding.com/privacy" target="_blank">Privacy Policy</a>' ;
})


.controller('PlaylistCtrl', function($scope) {
})

.controller('BestquestsCtrl', function($scope, Restangular) {
    Restangular.one('me', '').all('friends').getList().then(function(friends) {
       $scope.friends = friends;
    });
})

/*****
 * Quest Controller
 */
.controller('QuestCtrl', function($scope, Restangular, LanguageService, $state, $sessionStorage, $document, UploadService) {
    $scope.quest = {};
    
    UploadService.init(); 
    
    $scope.capture = function() {
        UploadService.capture();
    }
    
    function send(quest) {
        var a = ['topic', 'country', 'highschool', 'college', 'study', 'profession', 'company'];
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
            if (response.id > 0 ) {
                $sessionStorage.quest = response;
                
                UploadService.clear();
                $state.go("app.success", {questId: response.id});
            } else {
                alert('error on sending quest');
            }
        });
    }
    
    
    $scope.send = function(quest) {
        var locale = LanguageService.detectLocale(quest.text);
        
        if (locale === 'unknown') {
            $scope.showLanguageNotFound = 1;
            return;
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
    $scope.country = {};
    $scope.city = {};
    $scope.highschool = {};
    $scope.college = {};
    $scope.study = {};
    $scope.profession = {};
    $scope.company = {};
    $scope.language = {};
    
    $scope.refreshTopics = refresher('topics');
    $scope.refreshCountries = refresher('countries');
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
.controller('QuestSuccessCtrl', function($scope, Restangular, MapService, $sessionStorage) {

    
    var quest = $sessionStorage.quest;

    var questId = quest.id;
    
    MapService.create('success_worldmap');
    
    var firstReceiver = quest.receiver[0];
    $scope.firstname = firstReceiver.firstname;
    $scope.city = firstReceiver.city.name;
    
    MapService.addMarker('success_worldmap', firstReceiver.city.latitude, firstReceiver.city.longitude, firstReceiver.city.name);


    $scope.again = function() {
        Restangular.one('quests', questId).all('receivers').post().then(function(response) {
            if (response.hasOwnProperty('id')) {
                $scope.firstname = response.firstname;
                $scope.city = response.city.name;
                MapService.addMarker('success_worldmap', response.city.latitude, response.city.longitude, response.city.name);
            } else {
                $scope.noMatches = 1;
            }
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
    $scope.submit = function() {
        var topic = {id: $scope.topic.selected.id,  name: $scope.topic.selected.name}
        Restangular.one('me', '').all('topics').post(topic).then(function(response) {
            $scope.topicsList.unshift(response);
            $scope.topic.selected = undefined;
        });
    };
    
    $scope.delete = function(topic) {
        $scope.topics.splice( $scope.topics.indexOf(topic), 1 ); // remove element
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
.controller('WelcomeCityCtrl', function($scope, Restangular, $state, $localStorage) {
    $scope.address = {};
    $scope.refreshAddresses = function (address) {
        Restangular.all('cities').getList({q: address, add: 'true'}).then(function(cities){
            $scope.addresses =  cities;
        });
    };
    
    $scope.submitCity = function() {
        var user = {city: $scope.address.selected.id};
        
        Restangular.one('me', '').patch(user).get().then(function(user) {
            $state.go("app.quest");
        });

    };

})
/*****
 * Answers Controller
 */
.controller('AnswersCtrl', function($scope, Restangular, $sessionStorage, $state, ReadService) {
    var quest = $sessionStorage.quest;
   

    $scope.answers = quest.answers;
    
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
.controller('TourCtrl', function($scope, Restangular, $sessionStorage, $state, AuthService) {


    $scope.submitTopics = function(){
        var me = AuthService.me();
        me.tour_topics = false;
        
        AuthService.dispatch(1);
    };
    
    $scope.submitQuest = function() {
        var me = AuthService.me();
        me.tour_quest = false;
        AuthService.dispatch(1);
    };
    
    $scope.submitCity = function() {
        var me = AuthService.me();
        me.tour_quest = false;
        AuthService.dispatch(1);
    };
    
})


;
