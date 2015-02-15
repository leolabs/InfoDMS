/**
 * Created by Julian on 13.02.2015.
 */

var languages = ['de', 'en', 'fr'];

module.exports = {
    getStopwords: function(language) {
        if(languages.indexOf(language) != -1) {
            try {
                return require("./" + language + ".json");
            } catch(e) {
                return [];
            }
        } else {
            languages.forEach(function(key) {
                return require("./" + languages[key]);
            });
        }
    },
    getAvailableLanguages: function() {
        return languages
    }
};