const crypto = require('crypto'); // To create random state values for OAuth
const fetch = require('node-fetch');

// Kick starts the OAuth code flow
const authorize = (req,res)=>{
  // Random state value
  let state = crypto.randomBytes(16).toString('hex');
  req.session.oauth_state = state;

  // Get authentication URL and redirect
  authUrl = "https://github.com/login/oauth/authorize?"
            +"client_id=" + process.env.GITHUB_CLIENT_ID
            +"&scope=user:email"
            +"&state=" + state;
  res.redirect(authUrl);
}

// Call back for an authorization request
const auth = async (req, res) =>{
  // State received should be the same as the one stored within the session
  let state = req.query.state;
  let stored_state = req.session.oauth_state;
  req.session.oauth_state = null; // For security, validation is allowed once

  if(!stored_state || state != stored_state){
    res.status(401);
    return res.send("<h2>Authentication error. Try again</h2>");
  }
  if(!req.query.code){
    res.status(500);
    return res.send("<h2>Error authorizing Application</h2>");
  }

  try {
    let github_access_token = await getGitHubToken(req.query.code,state);
    req.session.email = await getGitHubEmail(github_access_token);
    req.session.github_username = await getGitHubUserName(github_access_token);
    return res.redirect("/cla");
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.send("<h2>An error ocurred with the GitHub API</h2>");
  }
}

// Exchanges code for an access token in GitHub
async function getGitHubToken(code,state){

  let url = "https://github.com/login/oauth/access_token";
  let body = {
      client_id : process.env.GITHUB_CLIENT_ID,
      client_secret : process.env.GITHUB_SECRET,
      code : code,
      redirect_uri : process.env.GITHUB_AUTH_CALLBACK_URL,
      state : state
    };
  let options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': "application/json"
      },
      body: JSON.stringify(body),
    }

  let response = await fetch(url,options);
  if(response.status != 200) throw new Error("couldn't get token from GitHub");
  let token = await response.json();
  return token.access_token;
}

// Fetches the primary email from GitHub
async function getGitHubEmail(github_access_token){

  let url = "https://api.github.com/user/emails";
  let options = {
      headers: {
        'Accept': "application/vnd.github.v3+json",
        'Authorization': 'Bearer ' + github_access_token
      }
    }

  let response = await fetch(url,options);
  if(response.status != 200) throw new Error("Couldn't get GitHub email");

  // Look for the primary email in the response
  let primary_email;
  let emails = await response.json();
  for(let i = 0; i < emails.length; i++){
    if(emails[i].primary == true){
      primary_email = emails[i].email;
      break;
    }
  }
  return primary_email;
}

// Fetches the GitHub username
async function getGitHubUserName(github_access_token){

  let url = "https://api.github.com/user";
  let options = {
      headers: {
        'Accept': "application/vnd.github.v3+json",
        'Authorization': 'Bearer ' + github_access_token
      }
    }

  let response = await fetch(url,options);
  if(response.status != 200) throw new Error("Couldn't get GitHub username");

  let user = await response.json();
  return user.login;
}

module.exports = {
  authorize: authorize,
  auth: auth
};
