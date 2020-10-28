require('dotenv').config({silent: true}); // read values from .env file

const controller = require('./controller.js');
const logger = require('morgan'); // Adding logging into the console
const multer  = require('multer'); // to handle multipart/form-data callbacks from HelloSign
const upload = multer();

const bodyParser = require('body-parser');
const express = require('express');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public')); 
app.use(logger('dev'));
const hbs = require('hbs');  // Handlebars as view template 
app.set('view engine', 'hbs');

const PORT = 3000;

// -- Endpoints --

// Home page
app.get('/', controller.home);

// Route to request a signature request embed URL for the hellosign client
app.post('/create_embed', controller.create_embed); 

// Route to handle hellosign callbacks
app.post('/hsevents', upload.none(), controller.processHelloSignEvents);

// Start server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));