/**
 * Created by leobernard on 01/03/15.
 */

module.exports = function(app, models, basePath) {
    // Getting the basePath returns a list of all tags
    app.get(basePath, function(req, res) {
        models.Tag.find(req.query, '', function(err, docs) {
            res.json(docs);
        })
    });

    // Returns the tag count
    app.get(basePath + "/stats", function(req, res){
        models.Tag.count(function(err, count) {
            res.json({count: count});
        })
    });

    // Outputs a single tag
    app.get(basePath + "/:id", function(req, res) {
        models.Tag.findById(req.params.id, '', function(err, doc) {
            if(!err) {
                if(doc) {
                    res.json(doc);
                }else{
                    res.status(404).json({error: "The tag could not be found."});
                }
            } else {
                models.defaultDBError(err, res);
            }
        });
    });

    // Modifies a tag by its ID
    app.put(basePath + "/:id", function(req, res) {
        models.Tag.findByIdAndUpdate(req.params.id, req.body, function(err, newDoc) {
            if(!err) {
                res.json(newDoc);
            } else {
                models.defaultDBError(err, res);
            }
        });
    });

    // Deletes a tag by its ID
    app.delete(basePath + "/:id", function(req, res) {
       models.Tag.findByIdAndRemove(req.params.id, function(err, doc) {
          if(!err) {
              res.json({success: true});
          } else {
              models.defaultDBError(err, res);
          }
       });
    });

    // Adds a new tag to the database
    app.post(basePath, function(req, res) {
        var tag = new models.Tag(req.body);

        tag.save(function(err, saved) {
            if(!err) {
                res.json(saved);
            }else{
                models.defaultDBError(err, res);
            }
        })
    });
};
