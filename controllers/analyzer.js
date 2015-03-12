/**
 * Created by leobernard on 01/03/15.
 */

module.exports = function(app, models, basePath) {
    var textAnalyzer = require("../components/textAnalyzer")(models);

    app.get(basePath, function(req, res) {
        textAnalyzer.getDocumentTypes(function(err, types) {
            if(!err) {
                res.json(types);
            }else{
                models.defaultDBError(res, err);
            }
        })
    });

    app.get(basePath + "/guessType/:id", function(req, res) {
        models.Document.findById(req.params.id, function(err, doc) {
            if(!err) {
                textAnalyzer.guessDocumentType(doc.text, function(err2, types) {
                    if(!err2) {
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

    app.get(basePath + "/addToDatabase/:id/:name", function(req, res) {
        models.Document.findById(req.params.id, function(err, doc) {
            if(!err) {
                textAnalyzer.analyzeTextsToDatabase([doc.text], req.params.name, function(err2, types) {
                    if(!err2) {
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