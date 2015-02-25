module.exports = function(models) {
    /**
     * Extracts all words from the given Text, ignoring all stop-words specified in <b>stop-words</b> files.
     * Returns a mapped object array containing word and its count.
     *
     * @param text
     * @returns {Array}
     */
    function extractKeywords(text) {
        var stopWords = require("../stop-words/").getStopwords(calculateDocumentLanguage(text));

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
        var lngDetector = new (require('languagedetect'));

        var languageToCode = {
            'english': 'en',
            'german': 'de',
            'french': 'fr'
        };

        var language = lngDetector.detect(text, 1)[0][0];

        if(languageToCode.hasOwnProperty(language)) {
            return languageToCode[language];
        } else {
            return null;
        }
    }

    /**
     * Creates a hash for the given file with the defined hashType.
     * Standardtype is md5
     * @param filepath The filepath to the file to hash
     * @param hashType The type of hashFunction(f.e. md5, sha1, dsa)
     * @param callback The callback function (err, data)
     */
    function calculateDocumentHash(filepath, hashType, callback) {
        var crypto = require('crypto');
        var fs = require('fs');

        var hash = crypto.getHashes().indexOf(hashType) > -1 ? crypto.createHash(hashType) : crypto.createHash('md5');

        var stream = fs.createReadStream(filepath);
        stream.on('data', function (data) {
            hash.update(data);
        });
        stream.on('end', function () {
            callback(false, hash.digest('hex'));
        });
    }

    return {
        analyzeTextsToDatabase: analyzeTextsToDatabase,
        analyzeTexts: analyzeTexts,
        calculateSimilarities: calculateSimilarities,
        guessDocumentType: guessDocumentType,
        getDocumentTypes: getDocumentTypes,
        calculateDocumentLanguage: calculateDocumentLanguage,
        calculateDocumentHash: calculateDocumentHash
    }
};