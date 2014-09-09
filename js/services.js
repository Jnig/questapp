//handler for push notifactions
onNotification = function (event) {
    var pushService = angular.element(document.querySelector('body')).injector()
        .get('PushService');
    pushService.onNotificationGCM(event);
};

function onNotificationAPN (event) {
    if ( event.alert )
    {
        navigator.notification.alert(event.alert);
    }

    if ( event.sound )
    {
        var snd = new Media(event.sound);
        snd.play();
    }

    if ( event.badge )
    {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
}

function tokenHandler (result) {
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
    alert('device token = ' + result);
}

angular.module('starter.services', [])


.service('ConnectService', function(Restangular, $ionicPopup, $timeout, $state, AuthService, isDesktop, baseUrl) {
    this.getToken = function(url) {
        var loginWindow = window.open(url, '_blank');
        
        loginWindow.addEventListener('loadstart', function (event) {
            console.log('DEBUG: Connect browser started loading');
            var url = event.url;
            console.log('DEBUG: Url ist'+url);
            
            var re = new RegExp('\\?token=([a-zA-Z0-9]+).*');
            var m = url.match(re);
            if (m !== null) {
                console.log('DEBUG: Token found, closing window');
                
                loginWindow.close();
                var token = m[1];
                
                console.log('Token: ' + token);
                
                AuthService.store(token);
                Restangular.setDefaultRequestParams({apikey: token});
                AuthService.check(1);

            }

       });
        
        loginWindow.addEventListener('exit', function () {
            console.log('exit');
        });
    };


    this.google = function() {
            if(isDesktop) {
                window.open("/connect/google?_destination=/connect_success%3Fclose=1", "mywindow", "location=1,status=1,width=400,height=600");
            } else {
                this.getToken(baseUrl + 'connect/google?_destination=/connect_success');
            }

    };
    
    this.facebook =  function() {
        if(isDesktop) {
            window.open("/connect/facebook?_destination=/connect_success%3Fclose=1", "mywindow", "location=1,status=1,width=400,height=600");
        } else {
            this.getToken(baseUrl + 'connect/facebook?_destination=/connect_success');
        }

    };
  
})
/***********
 * Cordova Events
 */
.service('AuthService', function($rootScope, Restangular, $state, PushService, EventService, $localStorage, $ionicPopup, $timeout, isDesktop, $http, $sessionStorage, $ionicLoading, $q) {
    var that = this;
    
    $rootScope.$on('resume', function(event, data) {
        console.log('resume event caught');
        //that.check();
    });  
    
    $rootScope.$on('deviceready', function(event, data) {
        console.log('deviceready event caught');
        //that.check();
    });
    
    
    this.check = function(redirect) {
        var deferred = $q.defer();
        
        Restangular.oneUrl('me', apiUrl + '/me').get().then(function(me) {               
            $localStorage.me = me;
            $sessionStorage.checked = 1;

            $rootScope.$broadcast('me', me);
            
            deferred.resolve('user is logged in');
            
            if (redirect) {
                that.dispatch(1);
            }

            PushService.register();
            EventService.start();
            
        }, function(response) {
            deferred.reject('user is not logged in');
            
            if(response.status === 403) { // not authorized, show login page
                that.logout();

                $state.go("welcome");
            }

        });
        
        return deferred.promise;
    };
    
    this.finishUniRegister = function() {
        if (isDesktop) {
            var object = {};

            if($sessionStorage.college  !== undefined) {
                object.colleges = [{id: $sessionStorage.college.id, name: $sessionStorage.college.name}];
            }
            
            if($sessionStorage.study !== undefined) {
                object.studies = [{id: $sessionStorage.study.id, name: $sessionStorage.study.name}];
            }
         
            if ($sessionStorage.college  !== undefined || $sessionStorage.study !== undefined){
                Restangular.one('me', '').patch(object).then(function() {
                    delete object.colleges;
                    delete object.studies;
                    that.check();
                });
            }

        }
        
    };
    
    this.logout = function() {
        PushService.unregister();
        EventService.stop();
        
        delete $localStorage.token;
        delete $sessionStorage.checked;
        
        Restangular.setDefaultRequestParams({apikey: ''});
        $http({method: 'GET', url: apiUrl+ '/../logout'});
    };
    
    this.login = function(email, password, redirect) {

        Restangular.all('tokens').post({email: email, password: password}).then(function(response) {
            if (typeof response !== 'undefined' && typeof response.token !== 'undefined' && response.token.length > 1) {
                that.store(response.token);
                Restangular.setDefaultRequestParams({apikey: response.token});
                that.check(redirect);
            }
            
            $ionicLoading.hide();
        }, function(error) {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: 'Invalid login',
                template: 'Username or password is wrong'
            });

            $timeout(function() {
                alertPopup.close(); //close the popup after 3 seconds for some reason
            }, 2000);
        });
        
    };
    
    this.dispatch = function(redirect) {
        try {
            var me = that.me();

            if (me.tour_city === true) {
               console.log('show city tour');

                $timeout(function() { // local storage is slow, therefore wait some time before redirecting on desktop app
                    $state.go('tour.city');
                }, 200);

            } else if (me.tour_topics === true) {
               console.log('show topics tour');
               
               $timeout(function() {
                    $state.go('tour.topics');
               }, 200);
            } else if (me.tour_quest === true) {
               console.log('show quest tour');
               
               $timeout(function() {
                    $state.go('tour.quest');
                }, 200);
            } else if(redirect) {
               $timeout(function() {
                    $state.go('app.quest');
               }, 200);
            }
        } catch (e) {
            console.log('DEBUG: error on dispatching welcome tour');
            console.log(e);
        } 
        
    };
    
    this.store = function(token) {
        $localStorage.token = token;
    };
    
    this.me = function() {
        return $localStorage.me;
    };
    this.get = function() {
        return $localStorage.me;
    };
    this.set = function(user) {
        $localStorage.me = user;
    };
    this.register = function(user) {
        
        user.timezone = jstz.determine().name();
        
        //detect language only in mobile app; on desktop use browser language
        if (!isDesktop) {
            user.language = navigator.language;
        }
        
        function success(response) {
            $ionicLoading.hide();
        
            if (isDesktop) {
                if (response.id > 0) {
                    $state.go('app.quest');
                }
            } else {
                ret.login(user.email, user.plainPassword);   
            }
        }
        
        function error(response) {
            $ionicLoading.hide();
            
            errors = [];
            // TODO: error handling in extra helper function
            angular.forEach(response.data.errors.children,function(value,index){
                if (value.errors instanceof Array) {
                    jQuery.merge(errors, value.errors);
                }
            });
            
            var alertPopup = $ionicPopup.alert({
                title: 'Registration',
                template: errors.join("<br />")
            });

            $timeout(function() {
                alertPopup.close(); //close the popup after 3 seconds for some reason
            }, 3000);
        }
        
        if (isDesktop) {
            Restangular.all('users').post(user, {login: '1'}).then(success, error);
        } else {
            Restangular.all('users').post(user).then(success, error);
        }
        
    };
})

/***********
 * MINLENGTH in guessLanguage.js must be set to 10
 */
.service('LanguageService', function() {
   
    this.detect = function(text) {
        var ret;

        guessLanguage.info(text, function(info) {
            ret = info;
        });
        
        return ret;
    };
    
    this.detectLocale = function(text) {
        return this.detect(text)[0];
    };

  
})

/***********
 * Map service
 */
.service('MapService', function() {
   
    this.create = function(id) {
        var width = $( window ).width();
        $('#'+id).css({width: width*0.8});
        
          $('#'+id).vectorMap({
              map: 'world_mill_en',
              scaleColors: ['#C8EEFF', '#0071A4'],
              normalizeFunction: 'polynomial',
              hoverOpacity: 0.7,
              hoverColor: false,
              markerStyle: {
                initial: {
                  fill: '#5DA074', 
                  stroke: '#FFFFFF'
                },
                hover: {
                  stroke: 'white',
                },
              },
              regionStyle: {
                initial: {
                  fill: '#E6E6E6',
                  "fill-opacity": 1,
                  stroke: 'none',
                  "stroke-width": 0,
                  "stroke-opacity": 1
                },
                hover: {
                  fill: '#848484',
                },
                selected: {
                  fill: 'yellow'
                },
                selectedHover: {
                }
              },
              backgroundColor: 'white',
              markers: []
            });
            

    };
    
    
    
    this.addMarker = function(id, lat, lng, name) {
        var map = $('#'+id).vectorMap('get', 'mapObject');
        var markerName = Math.random().toString(36).substring(3);
        
        map.addMarker(markerName, {latLng: [lat, lng], name: name});
    };

  
})

/***********
 * Push service
 */
.service('PushService', function($cordovaPush, $cordovaDevice, Restangular, $localStorage, isDesktop) {
    var that = this;

    
    this.onNotificationGCM = function(e) {
            switch( e.event ) {
            case 'registered':
                if ( e.regid.length > 0 ) {
                    
                    that.sendIdentifier(e.regid);
                }
            break;

            case 'message':
                // if this flag is set, this notification happened while we were in the foreground.
                // you might want to play a sound to get the user's attention, throw up a dialog, etc.
                if ( e.foreground ) {

                } else {  
                }

            break;

            case 'error':
                console.log(e);
            break;

            default:
                console.log(e);
            break;
          }
    }
    
    
    this.register = function() {
        if (typeof window.plugins === 'undefined'){
            return;
        }
        
        var config = {};
        try {
            if ($cordovaDevice.getPlatform() === 'Android' || $cordovaDevice.getPlatform() === 'android') {
                var config = {
                  "senderID":"787665944003",
                  "ecb":"onNotification"
                }; 
                $cordovaPush.register(config).then(function(result) {
                    console.log('DEBUG: Android push register result -' + result);
                }, function(err) {
                    console.log('DEBUG: Android push register result error - ' + err);
                });
            } else if ($cordovaDevice.getPlatform() === 'iOS') {
                var config = {
                  "badge":"true",
                  "sound":"true",
                  "alert":"true",
                  "ecb":"onNotificationAPN"
                };
                $cordovaPush.register(config).then(function(regid) {
                    console.log('DEBUG: IOS push register result -' + regid);
                    that.sendIdentifier(regid);
                }, function(err) {
                    console.log('DEBUG: IOS push register result error - ' + err);
                });
            } else {
                console.log('Platform not supporterd');
            }


        } catch (e) {
            console.log('DEBUG: failed push register');
            console.log(e);
        } 

    };
    
    that.sendIdentifier = function(identifier) {
        var identifier = {value: identifier, model: $cordovaDevice.getModel(), platform: $cordovaDevice.getPlatform(), version: $cordovaDevice.getVersion()};
        
        Restangular.one('me', '').all('identifiers').post(identifier).then(function(response) {
            $localStorage.push = response;
        });
    };

    this.unregister = function() {
        if (typeof window.plugins === 'undefined'){
            return;
        }
        
        // catch possible errors, which stops dev environment from working
        try {
            $localStorage.push.remove();
            delete $localStorage.push;
            $cordovaPush.unregister({}).then(function(result) {
                console.log('DEBUG: '+result);

            }, function(err) {
                console.log('DEBUG: '+err);
            });
        } catch (e) {
            console.log(e);
        } 
    };  
})
/***********
 * Push service
 */
.service('EventService', function($rootScope, Restangular, $localStorage, $timeout) {
    
    var that = this;
    this.run = 0;
    
    this.poller = function() {
        Restangular.one('events').get({timestamp: that.timestamp}).then(function(response) {
            if (that.run === 0) {
                return;
            }
            
            if (response.length === 0) { //timeout after 60 second
                that.poller();
                return;
            }

            if (response['events'].length > 0) {
                that.timestamp = response['events'][response['events'].length-1][0];
            }
            
            that.handler(response);   
            that.poller();

        }, function(error) {
            if (that.run === 0) {
                return;
            }
            
            console.log(error);

            $timeout(function() {
                    that.poller();
            }, 15000); // TODO: increase to 15 seconds

        });

    };
    
    this.handler = function(response) {
        var events = response['events'];
        $rootScope.$broadcast('unread', response['unread']);
                        
        events.forEach(function(entry) {
            switch(entry[1]) {
                case 'message':
                        $rootScope.$broadcast('message', entry[2]);
                    break;
                case 'answer':
                        $rootScope.$broadcast('answer', entry[2]);
                    break;
                case 'quest':
                        $rootScope.$broadcast('quest', entry[2]);
                    break;
            }
        });
    };

    
    this.start = function() {
        if (this.run === 0) {
            this.run = 1;
            this.poller();
        }
    };
    
    this.stop = function() {
        this.run = 0;
    };
    
})

/***********
 * marks quests/thread as read
 */
.service('ReadService', function($rootScope, Restangular) {
    var that = this;
   
    this.thread = function(id) {
        Restangular.one('threads', id).one('read', '').put().then(function(response) {
            that.handleResponse(response);
        });
    };
    
    this.questForMe = function(id) {
        Restangular.one('quests_for_me', id).one('read', '').put().then(function(response) {
            that.handleResponse(response);
        });
    };
    
    this.quest = function(id) {
        Restangular.one('quests', id).one('read', '').put().then(function(response) {
            that.handleResponse(response);
        });
    };

    this.handleResponse = function(response) {
        $rootScope.$broadcast('unread', response);
    }

  
})
.factory('debounce', function($timeout) {
    return function(callback, interval) {
        var timeout = null;
        return function() {
            $timeout.cancel(timeout);
            timeout = $timeout(callback, interval);
        };
    }; 
})
.service('UploadService', function(isDesktop, $cordovaCamera) {
  var uploader;
  var preloader;
  
  var imageData = '';
  
  this.init = function () {
    if (isDesktop) {
        uploader = new plupload.Uploader({
                runtimes : 'html5,flash,silverlight,html4',
                browse_button : 'attachmentUpload', // you can pass in id...
                url : '/v2',
                flash_swf_url : '/bower_components/plupload/Moxie.swf',
                silverlight_xap_url : '/bower_components/plupload/Moxie.xap',
                file_data_name: 'attachmentFile',
                resize : {width : 600, quality : 90},
                filters : {
                        max_file_size : '30mb',
                        mime_types: [
                                {title : "Image files", extensions : "jpg,gif,png"},
                        ]
                },
                init: {
                        FilesAdded: function(up, files) {
                            var item = $('#attachmentUpload')
                            var image = $( new Image() );
                            item.html(image);
                            preloader = new mOxie.Image();
                            preloader.onload = function() {
                                preloader.downsize( 800, 800 );
                                imageData = preloader.getAsDataURL();
                                image.prop( "src", imageData );
                            };
                            preloader.load( files[0].getSource() );

                        },
                }
        });
        uploader.init();
    }
  };
  
  this.getImage = function() {
      return imageData;
  };
  
  this.capture = function() {
        var options = { 
            quality : 75, 
            destinationType : Camera.DestinationType.DATA_URL, 
            sourceType : Camera.PictureSourceType.CAMERA, 
            allowEdit : false,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 800,
            targetHeight: 800,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: true,
            correctOrientation: true
        };

        $cordovaCamera.getPicture(options).then(function(image) {
            imageData = 'data:image/jpeg;base64,'+image;
            $('#attachment').html('<img src="' + imageData + '" />');
        }, function(err) {
        });
  };
  
  this.clear = function() {
        imageData = '';
        if(isDesktop) {
            $('#attachmentUpload').html('<img class="attach_symbol" src="img/quest/attach.png" />');
        } else {
            $('#attachment').html('<i class="ion-image"></i>');
        }
  };
  
  
})

/***********
 *  run startup tasks
 */
.service('StartService', function($rootScope, Restangular, $localStorage, gettextCatalog, $state, AuthService, baseUrl, $sessionStorage) {
    var that = this;
   
    this.setTranslation = function() {
        var languages = ['af', 'ar', 'ba', 'da', 'de', 'en', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'sw', 'zh'];
        
        try {
            navigator.globalization.getLocaleName(              
                function (locale) {
                    locale = locale.value.substring(0, 2).toLowerCase();                    
                    
                    console.log('DEBUG: settings locale to '+locale);
                    $localStorage.locale = locale;
                        
                    if (languages.indexOf(locale) !== -1) {
                        gettextCatalog.setCurrentLanguage(locale);
                    } else {
                        console.log('DEBUG: language not available, fallback to en')
                        gettextCatalog.setCurrentLanguage('en');
                    }

                }
            );
        } catch (e) {
                gettextCatalog.setCurrentLanguage('en');
        }



    };
    
    this.setApiUrl = function() {
        if ($localStorage.dev == 1) {
            console.log('Using local dev api');
            apiUrl = 'http://quest.dev/v2';
        } else {
            apiUrl = baseUrl + 'v2';
        }    
        Restangular.setBaseUrl(apiUrl);
    };

    
    this.redirect = function() {    
        if (typeof $localStorage.token !== 'undefined'  && $localStorage.token.length > 0) {
            Restangular.setDefaultRequestParams({apikey: $localStorage.token});
            $state.go('app.quest');
        } else {
            $state.go('welcome');
        }
    };

    this.setHandler = function() {    
        // when app it put in background
        document.addEventListener('pause', function() {
            $rootScope.$broadcast('pause');
        }, false);

        // when app is restored from background
        document.addEventListener('resume', function() {
            $rootScope.$broadcast('resume');
        }, false);
    };
    
    this.desktop = function() {
        apiUrl = '/v2';    
        Restangular.setBaseUrl(apiUrl);       
        
        if ( typeof $sessionStorage.checked === 'undefined') {
            AuthService.check().then(function() {
                AuthService.dispatch();
            });
        };
        

    };
  
})
;



