/**
 * Created by leobernard on 01/03/15.
 */

module.exports = function(app, models, basePath) {
    // Initialize the text analyzer
    var textAnalyzer = require("../components/textAnalyzer")(models);

    // Initialize the file upload module
    var multer = require('multer');

    // Initialize path and file system libraries
    var path = require('path');
    var fs = require('fs');
    var uploadDone = false;

    // Getting the basePath returns a list of all documents,
    // which can be filtered using GET-parameters
    app.get(basePath, function(req, res) {
        models.Document.find(req.query, '-keywords -text', function(err, docs) {
            res.json(docs);
        })
    });

    // Getting the stats, outputs the number of documents in the database
    app.get(basePath + "/stats", function(req, res){
        // Count the documents in the database
        models.Document.count(function(err, count) {
            // Output the results
            res.json({count: count});
        })
    });

    // Getting the latest n (def: 10) documents from the database
    app.get(basePath + "/latest/:count?", function(req, res) {
        // Get the latest n documents
        models.Document.find({}).sort({uploadedDate: -1}).limit(req.params.count || 10).exec(function(err, docs) {
            if(!err) {
                // Output the results
                res.json(docs);
            }else{
                models.defaultDBError(err, res);
            }
        })
    });

    // Getting a single document
    app.get(basePath + "/:id", function(req, res) {
        // Get the document from the database
        models.Document.findById(req.params.id, '', function(err, doc) {
            if(!err) {
                if(doc) {
                    // Output the result when the document was found
                    res.json(doc);
                }else{
                    // Return a 404 not found when the document wasn't found
                    res.status(404).json({error: "The document could not be found."});
                }
            } else {
                models.defaultDBError(err, res);
            }
        });
    });

    // Getting the raw document data
    app.get(basePath + "/:id/data", function(req, res) {
        // Get the document from the database
        models.Document.findById(req.params.id, '-keywords -text', function(err, doc) {
            if(!err) {
                if(doc) {
                    // Check if the file belonging to the document exists
                    fs.stat(doc.path, function (err2, stats) {
                        if (!err2) {
                            // Output the raw file
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

    // Putting a specific document can change its properties
    app.put(basePath + "/:id", function(req, res) {
        // Find the document and update the given fields
        models.Document.findByIdAndUpdate(req.params.id, req.body, function(err, newDoc) {
            if(!err) {
                // Output the new document
                res.json(newDoc);
            } else {
                models.defaultDBError(err, res);
            }
        });
    });

    // Deleting a document removes the entry from the database
    app.delete(basePath + "/:id", function(req, res) {
        // Find the document and delete it
        models.Document.findByIdAndRemove(req.params.id, function(err, doc) {
            if(!err) {
                // Return the result
                res.json({success: true});
            } else {
                models.defaultDBError(err, res);
            }
        });
    });

    // Getting documents_search returns a list of search results by the given query
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

    // Configure the file upload plugin
    app.use(multer({
        dest: './uploads/',
        onFileUploadStart: function(file, req, res) {
            console.log("Upload started:", file);
            uploadDone = false;
        },
        // Gets called when the file is completely uploaded
        onFileUploadComplete: function(file, req, res) {
            // Calculate the document hash
            textAnalyzer.calculateDocumentHash(file.path, null, function(error, hash){
                /**
                 * Analyzes a given document and saves it to the database
                 * @param doc the given document
                 */
                function analyzeDocument(doc) {
                    doc.keywords = textAnalyzer.extractKeywords(doc.text);
                    doc.state = 'analyzing';
                    doc.save();
                }

                // Create the new document
                var doc = new models.Document({
                    name: path.basename(file.originalname, path.extname(file.originalname)),
                    size: file.size,
                    path: file.path,
                    hash: hash,
                    extension: file.extension,
                    uploadedDate: Date.now(),
                    lastEditedDate: Date.now()
                });

                // Save the new document to the database
                doc.save(function(err, doc) {
                    if(!err && doc) {
                        // Output the created document
                        if(req.url.indexOf("/api/documents") === 0) res.json(doc);

                        // Initialize the OCR/extracting engine
                        var pdfExtract = require('pdf-extract');

                        // Try to extract text from the database
                        var processor = pdfExtract(doc.path, {type: 'text'}, function(){});

                        // When the extraction fails
                        processor.on('error', function(error) {
                            console.error(error);
                        });

                        // When the extraction succeeds
                        processor.on('complete', function(data) {
                            // Join the text pages to one string
                            var text = data.text_pages.join(" ").replace(/\s+/g, ' ').trim();

                            // Check if the extractor found any text
                            if(data.text_pages.length > 0 && text != "") {
                                // Save the extracted text to the database
                                doc.text = text;
                                doc.state = 'extracted';
                                doc.save(function(err) {
                                    // After that, analyze the document
                                    analyzeDocument(doc);
                                    if(err) console.error(err);
                                });
                            } else { // If no text could be extracted, try OCR
                                // Initialize the OCR engine
                                var ocr = pdfExtract(doc.path, {type: 'ocr', ocr_flags: ['alphanumeric']}, function(){});

                                // When the OCR process completes
                                ocr.on('complete', function(data) {
                                    // Save the OCRed text to the database
                                    doc.text = data.text_pages.join(" ").trim();
                                    doc.state = 'extracted';
                                    doc.save(function(err) {
                                        // Then analyze the document
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
