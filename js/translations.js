angular.module('gettext').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
    gettextCatalog.setStrings('de', {"Chats":"Nachrichten","Go on with Facebook":"Weiter mit Facebook","no Chats yet":"bis jetzt keine nachrichten"});
/* jshint +W100 */
}]);