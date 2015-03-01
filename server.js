// Mongoose initialisieren
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/infodms');

// Modelle initialisieren
var models = require("./models")(mongoose);

// ExpressJS initialisieren
var express = require('express');