/**
 * Created by leobernard on 01/03/15.
 */

module.exports = function(app, models, basePath) {
    var textAnalyzer = require("../components/textAnalyzer")(models);
    var multer = require('multer');
    var path = require('path');
    var uploadDone = false;

    app.get(basePath, function(req, res) {
        models.Document.find({}, function(err, docs) {
            res.json(docs);
        })
    });
    
    app.get(basePath + "/removeDoc/:id", function(req, res) {
       models.Document.findByIdAndRemove(req.param('id'), function(err, doc) {
          if(!err) {
              res.send("The document \'" + doc.name + "\' was successfully deleted.");
          } else {
              console.log(err);
              res.send("Error deleting file");
          }
       });
    });
    
    app.get(basePath + "/searchDocument/:q", function(req, res) {
       models.Document.find({keywords.word : req.query.q}, function(err, docs) {
           if(!err) {
               docs.sort(function(a,b) {return b.keywords.absoluteCount-a.keywords.absoluteCount});
               res.json(docs);
           } else {
               res.send("error" + err);
           }
       }); 
    });

    app.use(multer({
        dest: './uploads/',
        onFileUploadStart: function(file, req, res) {
            console.log("Upload started:", file);
            uploadDone = false;
        },
        onFileUploadComplete: function(file, req, res) {
            textAnalyzer.calculateDocumentHash(file.path, null, function(error, hash){
                var doc = new models.Document({
                    name: path.basename(file.originalname, path.extname(file.originalname)),
                    size: file.size,
                    path: file.path,
                    hash: hash,
                    extension: file.extension,
                    uploadedDate: Date.now(),
                    lastEditedDate: Date.now()
                });

                doc.save(function(err, doc) {
                    if(!err && doc) {
                        res.json(doc);
                    }
                })
            });
        },
        rename: function(fieldname, filename, req, res){
            return filename;
        },
        onError: function(error, next) {
            console.log("Upload error:", error);
            next(error);
        }
    }));

    app.post(basePath, function(req, res) {
        if(uploadDone) {
            res.end();
        }
    });
};
