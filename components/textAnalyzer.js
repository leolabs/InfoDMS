module.exports = function(models) {

    /**
     * Extracts all words from the given Text, ignoring all stop-words specified in <b>sw_index.js</b> file.
     * Returns a mapped onject array containing word and its count.
     * @param text
     * @param language
     * @returns {Array}
     */
    function extractKeywords(text, language) {
        var allLanguages = require("./../stop-words/sw_index.js").allLanguages;
        var stopWords = "";
        if(allLanguages.hasOwnProperty(language)) {
            stopWords = require(allLanguages[language]);
        } else {
            Object.keys(allLanguages).forEach(function(key) {
               stopWords += require(allLanguages[key]);
            });
        }
        console.log(stopWords);
        var keywords = {};

        //var textParts = text.split(/\s+/);
        var analyzeParts = text.split(/\s+/);

        /*for(var length = 2; length <= 2; length++) { // Takes too fucking long!
            for(var i = 0; i <= textParts.length - length; i++) {
                analyzeParts.push(textParts.slice(i, i+length).join(" "));
            }
        }*/

        analyzeParts.forEach(function(word) {
            word = word.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, ' ').trim();
            word = word.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss");

            if (word != "" && word.length >= 3 && stopWords.indexOf(word) <= -1) {
                if (keywords.hasOwnProperty(word)) {
                    keywords[word] += 1;
                } else {
                    keywords[word] = 1;
                }
            }
        });

        return Object.keys(keywords).map(function(value) {
            return {
                word: value,
                count: keywords[value]
            }
        });
    }

    function calculateAverage(wordCount, field, textFilesCount) {
        var words = wordCount.slice();

        words = words.map(function(word){
            word['average' + field.substr(0, 1).toUpperCase() + field.substr(1)] = word[field] / textFilesCount;
            return word;
        });

        return words;
    }

    function mapArrayToObject(array, field) {
        var obj = {};

        array.forEach(function(item) {
            obj[item[field]] = item;
        });

        return obj;
    }

    function analyzeTexts(textFiles, existingData, analyzedDocumentCount, progressCallback) {
        var keywords = existingData || {};

        textFiles.forEach(function(file, index) {
            if(progressCallback) progressCallback(index+1, textFiles.length);

            var textKeywords = extractKeywords(file);

            textKeywords.forEach(function(keyword){
                if(keywords.hasOwnProperty(keyword.word)) {
                    keywords[keyword.word].count += keyword.count;
                    keywords[keyword.word].absoluteCount += 1;
                } else {
                    keyword.absoluteCount = 1;
                    keywords[keyword.word] = keyword;
                }
            });
        });

        var mappedKeywords = Object.keys(keywords).map(function(key) {
            return keywords[key];
        });

        mappedKeywords = calculateAverage(mappedKeywords, 'count', textFiles.length + (analyzedDocumentCount || 0));
        mappedKeywords = calculateAverage(mappedKeywords, 'absoluteCount', textFiles.length + (analyzedDocumentCount || 0));

        mappedKeywords = mappedKeywords.sort(function(a, b){
            return b.absoluteCount - a.absoluteCount;
        });

        return mappedKeywords;
    }

    function analyzeTextsToDatabase(textFiles, dataType, callback, progressCallack) {
        models.DocumentType.findOne({name: dataType}, function(err, doc) {
            if(!err) {
                var existingData = doc ? mapArrayToObject(doc.keywords, 'word') : {};
                var keywords = analyzeTexts(textFiles, existingData, doc ? doc.analyzedDocuments : 0, progressCallack);

                if(doc) {
                    models.DocumentType.findByIdAndUpdate(doc._id, {
                        keywords: keywords,
                        analyzedDocuments: (doc ? doc.analyzedDocuments : 0) + textFiles.length
                    }, function(err2, doc2){
                        callback(err2, doc2);
                    });
                }else{
                    var type = new models.DocumentType({name: dataType, analyzedDocuments: textFiles.length, keywords: keywords});
                    type.save(function(err2, doc2){
                        callback(err2, doc2);
                    });
                }
            } else {
                callback(true, null);
            }
        });
    }

    function calculateSimilarity(textFile, averageCountList) {
        var wordList = extractKeywords(textFile);
        var averageCounts = {};
        var averageSum = 0;

        averageCountList.filter(function(word) {
            return word.absoluteCount > 1;
        }).forEach(function(word) {
            averageCounts[word.word] = word;
            averageSum += word.averageAbsoluteCount
        });

        var similarity = 0;

        wordList.forEach(function(word) {
            if(averageCounts.hasOwnProperty(word.word)) {
                similarity += averageCounts[word.word].averageAbsoluteCount;
            }
        });

        return similarity / averageSum;
    }

    function calculateSimilarities(text, callback) {
        models.DocumentType.find(function(err, types) {
            if(!err) {
                var similarities = [];

                types.forEach(function(type) {
                    similarities.push({
                        _id: type._id,
                        type: type.name,
                        similarity: calculateSimilarity(text, type.keywords)
                    });
                });

                similarities.sort(function(a, b) {
                    return b.similarity - a.similarity;
                });

                callback(false, similarities);
            } else {
                callback(err, null);
            }
        });
    }

    function guessDocumentType(text, callback) {
        calculateSimilarities(text, function(err, similarities){
            if(!err) {
                if(similarities.length > 0) {
                    callback(false, similarities[0]);
                } else {
                    callback(false, null);
                }
            }else{
                callback(err, null);
            }
        });
    }

    function getDocumentTypes(callback) {
        models.DocumentType.aggregate([{
            $group: {
                _id: "$name"
            }
        }], function(err, docs){
            if(!err) {
                callback(false, docs.map(function(doc){return doc._id}));
            } else {
                callback(err, null);
            }
        });
    }

    function calculateDocumentLanguage(text) {
        var languages = require("./../stop-words/sw_index.js").allLanguages;
        var analyzeParts = text.split(/\s+/);
        var countedWords = {};
        var stopwords = [];
        Object.keys(languages).forEach(function(key) {
            stopwords[key] = require(languages[key]);   //Loading first to reduce memory usage and runtime
        });

        analyzeParts.forEach(function(word) {
            word = word.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, ' ').trim();
            word = word.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss"); //For german language only: Maybe add other languages later, but in the specific stop-words file

            Object.keys(languages).forEach(function(key) {
                if(stopwords[key].indexOf(word) > -1) {
                    if(countedWords.hasOwnProperty(key)) {
                        countedWords[key] += 1;
                    } else {
                        countedWords[key] = 1;
                    }
                }
            });
        });

        var mostUsedLanguageName = Object.keys(countedWords)[0];
        var mostUsedLanguageCount = countedWords[mostUsedLanguageName];
        Object.keys(countedWords).forEach(function(element) {
           if(countedWords[element] > mostUsedLanguageCount) {
               mostUsedLanguageCount = countedWords[element];
               mostUsedLanguageName = element;
           }
        });
        return mostUsedLanguageName;
    }



    return {
        analyzeTextsToDatabase: analyzeTextsToDatabase,
        analyzeTexts: analyzeTexts,
        calculateSimilarities: calculateSimilarities,
        guessDocumentType: guessDocumentType,
        getDocumentTypes: getDocumentTypes,
        calculateDocumentLanguage: calculateDocumentLanguage
    }
};