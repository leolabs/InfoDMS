// Mongoose initialisieren
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/infodms');

// Modelle initialisieren
var models = require("./models")(mongoose);

// ExpressJS initialisieren
var express = require('express');
var app     = express();

// Controller initialisieren
require("./controllers/analyzer")(app, models, '/api/analyzer');
require("./controllers/document")(app, models, '/api/documents');

app.listen(8091, function(){
    console.log('Express server listening on port ' + 8091);
});