/**
 * Created by leobernard on 01/03/15.
 */

module.exports = function(app, models, basePath) {
    var textAnalyzer = require("../components/textAnalyzer")(models);

    app.get(basePath, function(req, res) {
        textAnalyzer.getDocumentTypes(function(types) {
            res.json(types);
        })
    });

    app.post(basePath + "/guessType/:id", function(req, res) {
        models.Document.findById(req.param('id'), function(err, doc) {
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
};