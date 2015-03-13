/**
 * Created by Julian on 13.02.2015.
 */

var languages = ['de', 'en', 'fr'];

module.exports = {
    /**
     * Returns all stop-words
     * @returns {Array} a list of all stop-words
     */
    getStopwords: function() {
        var stopWords = [];

        languages.forEach(function(lang) {
            stopWords = stopWords.concat(require("./" + lang + ".json"));
        });

        return stopWords;
    },

    /**
     * Returns a list of all available languages
     * @returns {string[]}
     */
    getAvailableLanguages: function() {
        return languages;
    }
};