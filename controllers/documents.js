/**
 * Created by leobernard on 01/03/15.
 */

module.exports = function(app, models, basePath) {
    var textAnalyzer = require("../components/textAnalyzer")(models);
    var multer = require('multer');
    var path = require('path');
    var fs = require('fs');
    var uploadDone = false;

    app.get(basePath, function(req, res) {
        models.Document.find(req.query, '-keywords -text', function(err, docs) {
            res.json(docs);
        })
    });

    app.get(basePath + "/stats", function(req, res){
        models.Document.count(function(err, count) {
            res.json({count: count});
        })
    });

    app.get(basePath + "/latest/:count?", function(req, res) {
        models.Document.find({}).sort({uploadedDate: -1}).limit(req.params.count || 10).exec(function(err, docs) {
            if(!err) {
                res.json(docs);
            }else{
                models.defaultDBError(err, res);
            }
        })
    });

    app.get(basePath + "/:id", function(req, res) {
        models.Document.findById(req.params.id, '', function(err, doc) {
            if(!err) {
                if(doc) {
                    res.json(doc);
                }else{
                    res.status(404).json({error: "The document could not be found."});
                }
            } else {
                models.defaultDBError(err, res);
            }
        });
    });

    app.get(basePath + "/:id/data", function(req, res) {
        models.Document.findById(req.params.id, '-keywords -text', function(err, doc) {
            if(!err) {
                if(doc) {
                    fs.stat(doc.path, function (err2, stats) {
                        if (!err2) {
                            res.sendfile(doc.path);
                        } else {
                            res.status(404).json({error: "The file at " + doc.path + " could not be found."})
                        }
                    });
                }else{
                    res.status(404).json({error: "The document could not be found."});
                }
            } else {
                models.defaultDBError(err, res);
            }
        });
    });

    app.put(basePath + "/:id", function(req, res) {
        models.Document.findByIdAndUpdate(req.params.id, req.body, function(err, newDoc) {
            if(!err) {
                res.json(newDoc);
            } else {
                models.defaultDBError(err, res);
            }
        });
    });
    
    app.delete(basePath + "/:id", function(req, res) {
       models.Document.findByIdAndRemove(req.params.id, function(err, doc) {
          if(!err) {
              res.json({success: true});
          } else {
              models.defaultDBError(err, res);
          }
       });
    });
    
    app.get(basePath + "_search", function(req, res) {
        var queries = req.query.q.split(/\s+/g).map(function(searchWord) {
            searchWord = searchWord.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
            return {'keywords.word': new RegExp(".*" + searchWord + ".*")};
        });

        var searchQuery = {};
        searchQuery['$' + (req.query.operator || 'and')] = queries;

        var sort = {};
        if(req.query.sort) {
            sort[req.query.sort] = req.query.sortDir || 1;
        }

        console.log(searchQuery);

        models.Document.find({$or: [searchQuery, {'name': new RegExp(".*" + req.query.q + ".*")}]}).sort(sort).exec(function(err, docs) {
           if(!err) {
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
                function analyzeDocument(doc) {
                    console.log("Extracting Keywords...");
                    var textAnalyzer = require('../components/textAnalyzer')(models);

                    doc.keywords = textAnalyzer.extractKeywords(doc.text);

                    console.log(textAnalyzer.extractKeywords(doc.text));

                    doc.state = 'analyzing';

                    doc.save();
                }

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
                        if(req.url.indexOf("/api/documents") === 0) res.json(doc);

                        var pdfExtract = require('pdf-extract');

                        console.log("Extracting...");
                        var processor = pdfExtract(doc.path, {type: 'text'}, function(){});

                        processor.on('error', function(error) {
                            console.error(error);
                        });

                        processor.on('complete', function(data) {
                            console.log("Complete.");

                            var text = data.text_pages.join(" ").replace(/\s+/g, ' ').trim();

                            if(data.text_pages.length > 0 && text != "") {
                                doc.text = text;
                                doc.state = 'extracted';
                                doc.save(function(err) {
                                    analyzeDocument(doc);
                                    if(err) console.error(err);
                                });
                            } else {
                                console.log("OCRing...");
                                var ocr = pdfExtract(doc.path, {type: 'ocr', ocr_flags: ['alphanumeric']}, function(){});

                                ocr.on('complete', function(data) {
                                    console.log("Complete.");
                                    doc.text = data.text_pages.join(" ").trim();
                                    doc.state = 'extracted';
                                    doc.save(function(err) {
                                        analyzeDocument(doc);
                                        if(err) console.error(err);
                                    });
                                });
                            }
                        });
                    }
                });
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
