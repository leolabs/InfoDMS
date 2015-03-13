/**
 * Created by leobernard on 01/03/15.
 */

module.exports = function(app, models, basePath) {
    // Initialize the text analyzer
    var textAnalyzer = require("../components/textAnalyzer")(models);

    // Getting the basePath returns a list of available document types
    app.get(basePath, function(req, res) {
        // Get document types
        textAnalyzer.getDocumentTypes(function(err, types) {
            if(!err) {
                // Output the result
                res.json(types);
            }else{
                models.defaultDBError(res, err);
            }
        })
    });

    // Guess the type of a document by its ID
    app.get(basePath + "/guessType/:id", function(req, res) {
        // Get the document by its ID
        models.Document.findById(req.params.id, function(err, doc) {
            if(!err) {
                // Call the guess method with the given document text
                textAnalyzer.guessDocumentType(doc.text, function(err2, types) {
                    if(!err2) {
                        // Output the result
                        res.json(types);
                    }else{
                        models.defaultDBError(err2, res);
                    }
                });
            }else{
                models.defaultDBError(err, res);
            }
        })
    });

    // Analyze a given document and add the results to the database
    app.get(basePath + "/addToDatabase/:id/:name", function(req, res) {
        // Find the document in the database
        models.Document.findById(req.params.id, function(err, doc) {
            if(!err) {
                // Analyze the text and add it to the database
                textAnalyzer.analyzeTextsToDatabase([doc.text], req.params.name, function(err2, types) {
                    if(!err2) {
                        // Output the result
                        res.json({success: true});
                    }else{
                        models.defaultDBError(err2, res);
                    }
                });
            }else{
                models.defaultDBError(err, res);
            }
        })
    });
};