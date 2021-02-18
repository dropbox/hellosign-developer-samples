const express = require('express');
const app = express();
const logger = require('morgan'); // Adds Http logging into the console
require('hbs');  // Handlebars as view engine
require('dotenv').config({silent: true}); // Read values from .env file
const PORT = 3000;

const github = require('./github.js');
const hellosign = require('./hellosign.js');
const session = require('express-session'); // Session management
// Session initialization
// Uses local storage, for testing purposes only
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'hbs');
app.use(logger('dev'));

// Starts server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));

// CLA signature page
app.get('/cla', async (req,res)=>{

  if(!req.session.email){
    github.authorize(req,res);
  }else{

    let embed_url;
    try{
      embed_url = await hellosign.getEmbedURL(req.session.email,req.session.github_username);
    }catch(error){
      console.log(error);
      res.status(500);
      return res.send("<h2>An error ocurred with HelloSign</h2>");
    }

    let args = {
      layout: false,
      hellosign_client_id: process.env.HELLOSIGN_CLIENT_ID,
      embed_url: embed_url,
    };
    res.render("index", args);
  }
});

// GitHub OAuth callback
app.get('/auth', github.auth);
