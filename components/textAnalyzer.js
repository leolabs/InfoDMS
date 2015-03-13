module.exports = function(models) {
    /**
     * Extracts all words from the given Text, ignoring all stop-words specified in <b>stop-words</b> files.
     * Returns a mapped object array containing word and its count.
     *
     * @param text
     * @returns {Array}
     */
    function extractKeywords(text) {
        // Load stop-words from files
        var stopWords = require("../stop-words/").getStopwords();

        // Initialize keyword-dictionary
        var keywords = {};

        // Split text at every white-space
        var analyzeParts = text.split(/\s+/);

        analyzeParts.forEach(function(word) {
            // Replace German umlauts with ASCII-equivalents
            word = word.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss");
            // Remove non-letters and white-spaces from word
            word = word.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, ' ').trim();

            // Check if the word is at least 3 characters long and is not a stop-word
            if (word.length >= 3 && stopWords.indexOf(word) <= -1) {
                // Check if the word is already in our dictionary
                if (keywords.hasOwnProperty(word)) {
                    keywords[word] += 1;
                } else {
                    keywords[word] = 1;
                }
            }
        });

        // Map the keyword-dictionary to an array and return it
        return Object.keys(keywords).map(function(value) {
            return {
                word: value,
                count: keywords[value]
            }
        });
    }

    /**
     * Calculates the average of a field and adds it to the Object
     *
     * @param wordCount the array containing the counted words
     * @param field the field that should be averaged
     * @param textFilesCount the number of textFiles that were analyzed
     * @returns {Array<Object>}
     */
    function calculateAverage(wordCount, field, textFilesCount) {
        // Copy the array of words so we don't modify the original
        var words = wordCount.slice();

        // Add an average-field to every word
        words = words.map(function(word){
            word['average' + field.substr(0, 1).toUpperCase() + field.substr(1)] = word[field] / textFilesCount;
            return word;
        });

        return words;
    }

    /**
     * Maps an array of objects to an object using a given field that exists in every entry.
     *
     * @param array the input array consisting of objects
     * @param field the field which should be used for mapping
     * @returns {{}}
     */
    function mapArrayToObject(array, field) {
        var obj = {};

        // Create a field for each item in the array
        array.forEach(function(item) {
            obj[item[field]] = item;
        });

        return obj;
    }

    /**
     * Analyzes multiple text files and returns the list of used keywords with their priorities
     *
     * @param textFiles an array of texts
     * @param existingData already analyzed data
     * @param analyzedDocumentCount the number of already analyzed documents
     * @param progressCallback gets called every time a document is analyzed
     * @returns {Array} a list of keywords and their priorities
     */
    function analyzeTexts(textFiles, existingData, analyzedDocumentCount, progressCallback) {
        // Initialize dictionary with keywords, use existing data is given
        var keywords = existingData || {};

        // Process every text
        textFiles.forEach(function(file, index) {
            // If a progress callback is defined, call it
            if(progressCallback) progressCallback(index+1, textFiles.length);

            // Extract keywords from the current text
            var textKeywords = extractKeywords(file);

            // Merge keywords with data from other documents
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

        // Convert the keyword-dictionary into an array
        var mappedKeywords = Object.keys(keywords).map(function(key) {
            return keywords[key];
        });

        // Calculate the average counts
        mappedKeywords = calculateAverage(mappedKeywords, 'count', textFiles.length + (analyzedDocumentCount || 0));
        mappedKeywords = calculateAverage(mappedKeywords, 'absoluteCount', textFiles.length + (analyzedDocumentCount || 0));

        // Sort keywords by their count
        mappedKeywords = mappedKeywords.sort(function(a, b){
            return b.absoluteCount - a.absoluteCount;
        });

        return mappedKeywords;
    }

    /**
     * Analyzes an array of text files and saves the result to the database
     *
     * @param textFiles an array of texts
     * @param documentType the document type that should be analyzed (Receipt, Certificate, Mail, etc.)
     * @param callback gets called when everything is analyzed
     * @param progressCallack gets called each time a new document is analyzed
     */
    function analyzeTextsToDatabase(textFiles, documentType, callback, progressCallack) {
        // Check if the document type is already saved in the database
        models.DocumentType.findOne({name: documentType}, function(err, doc) {
            if(!err) {
                // If yes, use existing data
                var existingData = doc ? mapArrayToObject(doc.keywords, 'word') : {};

                // Extract keywords from the given text files
                var keywords = analyzeTexts(textFiles, existingData, doc ? doc.analyzedDocuments : 0, progressCallack);

                // If the document type is already saved in the database
                if(doc) {
                    // Update the document type
                    models.DocumentType.findByIdAndUpdate(doc._id, {
                        keywords: keywords,
                        analyzedDocuments: (doc ? doc.analyzedDocuments : 0) + textFiles.length
                    }, function(err2, doc2){
                        callback(err2, doc2);
                    });
                }else{
                    // Save the new document type into our database
                    var type = new models.DocumentType({name: documentType, analyzedDocuments: textFiles.length, keywords: keywords});
                    type.save(function(err2, doc2){
                        callback(err2, doc2);
                    });
                }
            } else {
                callback(true, null);
            }
        });
    }

    /**
     * Calculates the similarity of a text with a document type
     *
     * @param textFile the text
     * @param averageCountList the analyzed data from our document type
     * @returns {number} the similarity from 0 (not similar) to 1 (almost the same)
     */
    function calculateSimilarity(textFile, averageCountList) {
        // Extract keywords from the text that we want to compare
        var wordList = extractKeywords(textFile);

        // Initialize dictionary for the average word counts
        var averageCounts = {};
        var averageSum = 0;

        // Only use words that exist in more than one document
        averageCountList.filter(function(word) {
            return word.absoluteCount > 1;
        // Only use the 100 most used words
        }).slice(0, 100).forEach(function(word) {
            // Map data array into dictionary
            averageCounts[word.word] = word;

            // Calculate the sum of all average counts
            averageSum += word.averageAbsoluteCount
        });

        var similarity = 0;

        // Go through every word and add its average count to the similarity
        // if it exists in other documents
        wordList.forEach(function(word) {
            if(averageCounts.hasOwnProperty(word.word)) {
                similarity += averageCounts[word.word].averageAbsoluteCount;
            }
        });

        // Return the sum of average counts used in the text divided by the sum of all average counts
        return similarity / averageSum;
    }

    /**
     * Calculates similarities of a text with all saved document types
     *
     * @param text the text that should be analyzed
     * @param callback gets called when whe similarities have been calculated
     */
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

    /**
     * Guesses the types of a document (deprecated)
     *
     * @param text the given text
     * @param callback gets called when all similarities have been calculated
     */
    function guessDocumentType(text, callback) {
        calculateSimilarities(text, function(err, similarities){
            if(!err) {
                callback(false, similarities);
            }else{
                callback(err, null);
            }
        });
    }

    /**
     * Returns a list of all available document types together with the count of analyzed documents
     *
     * @param callback gets called when all data is fetched
     */
    function getDocumentTypes(callback) {
        models.DocumentType.aggregate([{
            $group: {
                _id: "$name",
                analyzedDocuments: {"$sum": "$analyzedDocuments"}
            }
        },{
            $sort: {analyzedDocuments: -1}
        }], function(err, docs){
            if(!err) {
                callback(false, docs);
            } else {
                callback(err, null);
            }
        });
    }

    /**
     * Creates a hash for the given file with the defined hashType.
     * Default type is md5
     *
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
        extractKeywords: extractKeywords,
        analyzeTextsToDatabase: analyzeTextsToDatabase,
        analyzeTexts: analyzeTexts,
        calculateSimilarities: calculateSimilarities,
        guessDocumentType: guessDocumentType,
        getDocumentTypes: getDocumentTypes,
        calculateDocumentHash: calculateDocumentHash
    }
};