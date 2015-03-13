// Mongoose initialisieren
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/infodms');

// Modelle initialisieren
var models = require("./models")(mongoose);

// ExpressJS initialisieren
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();

// JSON-Parser
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json


// Controller initialisieren
require("./controllers/analyzer")(app, models, '/api/analyzer');
require("./controllers/documents")(app, models, '/api/documents');
require("./controllers/tags")(app, models, '/api/tags');

// Fileserving für das Webinterface initialisieren
app.use(express.static('static'));

// Auf Port 8091 hören
app.listen(8091, function(){
    console.log('Express server listening on port ' + 8091);
});