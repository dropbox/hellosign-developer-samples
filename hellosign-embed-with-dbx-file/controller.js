// Dropbox related libraries
const Dropbox = require("dropbox").Dropbox;
const dbx = new Dropbox({ accessToken: process.env.dbx_access_token });

// Hellosign related libraries
const hellosign = require("hellosign-sdk")({ key: process.env.hs_api_key });
const crypto = require("crypto"); // to compare event hash

// Returns the Client form (main page)
const home = (req, res) => {
  let args = {
    layout: false,
    hs_client_id: process.env.hs_client_id,
    dropbox_app_key: process.env.dropbox_app_key,
  };
  res.render("index", args);
};

// Returns the URL for a HelloSign unclaimed embed request
const create_embed = async (req, res) => {
  try {
    // Get temporary link from Dropbox using the file_id
    let temp_link = await dbx.filesGetTemporaryLink({ path: req.body.file_id });

    // Hellosign options
    let options = {
      test_mode: 1,
      clientId: process.env.hs_client_id,
      type: "request_signature",
      requester_email_address: req.body.sender_email_address,
      file_url: [temp_link.result.link],
      metadata: {
        dbx_file_id: req.body.file_id, //Store Dropbox file_id in metadata
      },
    };

    // Get embeded URL from HelloSign
    let hs_resp = await hellosign.unclaimedDraft.createEmbedded(options);
    let url = hs_resp.unclaimed_draft.claim_url;

    // Send URL back
    res.send(url);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.mesage);
  }
};

// Handles callbacks coming from HelloSign
const processHelloSignEvents = (req, res) => {
  // Obtains the body of the message in a consumable format
  let msg = JSON.parse(req.body.json);
  let event = msg.event;

  // Compare event hash first to ensure its coming from HS
  let event_hash = event.event_hash;
  const hash = crypto
    .createHmac("sha256", process.env.hs_api_key)
    .update(event.event_time + event.event_type)
    .digest("hex")
    .toString();
  if (event_hash != hash) {
    console.log("Event hash doesn't match");
    res.status(401);
    return res.end();
  }

  console.log("HS Event received: " + event.event_type);

  if (event.event_type == "signature_request_all_signed") {
    setImmediate(uploadToDropbox, msg); // process event after replying back to HS Server
  }

  res.send("Hello API Event Received"); //HelloSign expects this response
};

// Saves the edited file in the current session to Dropbox in the same folder
async function uploadToDropbox(event_data) {
  let file_id = event_data.signature_request.metadata.dbx_file_id;
  let request_id = event_data.signature_request.signature_request_id;

  try {
    // get the path of the original file from Dropbox
    let file_metadata_result = await dbx.filesGetMetadata({ path: file_id });
    let path_lower = file_metadata_result.result.path_lower;

    // get the download URL from HS
    let hs_download_args = {
      file_type: "pdf",
      get_url: true,
    };
    let download_response = await hellosign.signatureRequest.download(
      request_id,
      hs_download_args
    );

    // Append an edited note to the name of the file
    let dbx_save_path =
      path_lower.substr(0, path_lower.lastIndexOf(".")) + "(All signed).pdf";

    // Upload file to Dropbox. Upload happens asynchronously
    let upload_params = {
      url: download_response.file_url,
      path: dbx_save_path,
    };
    await dbx.filesSaveUrl(upload_params);

    console.log("Uploaded file to Dropbox path:" + dbx_save_path);
  } catch (error) {
    // This is where you should handle Dropbox related errors
    // More information https://www.dropbox.com/lp/developers/reference/error-handling-guide
    console.log(error);
  }
}

module.exports = {
  home: home,
  create_embed: create_embed,
  processHelloSignEvents: processHelloSignEvents,
};