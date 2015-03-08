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
require("./controllers/documents")(app, models, '/api/documents');

// Fileserving für das Webinterface initialisieren
app.use(express.static('static'));

app.listen(8091, function(){
    console.log('Express server listening on port ' + 8091);
});