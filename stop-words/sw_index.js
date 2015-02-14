/**
 * Created by Julian on 13.02.2015.
 */

var origin = "./../stop-words/";

var languages = {
    "Deutsch" : "de.json",
    "English" : "en.json",
    "French" : "fr.json"
};
Object.keys(languages).map(function(lang) {
   languages[lang] = origin + languages[lang];
});

exports.allLanguages  = languages;