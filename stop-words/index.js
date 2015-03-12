/**
 * Created by Julian on 13.02.2015.
 */

var languages = ['de', 'en', 'fr'];

module.exports = {
    getStopwords: function(language) {
        var stopWords = [];

        languages.forEach(function(lang) {
            stopWords = stopWords.concat(require("./" + lang + ".json"));
        });

        return stopWords;
    },
    getAvailableLanguages: function() {
        return languages;
    }
};