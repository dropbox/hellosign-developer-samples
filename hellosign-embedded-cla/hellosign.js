const hellosign = require("hellosign-sdk")({ key: process.env.HELLOSIGN_API_KEY });

const getEmbedURL = async (github_email,github_username)=>{
  let options = {
    test_mode: 1,
    clientId: process.env.HELLOSIGN_CLIENT_ID,
    template_id: process.env.CLA_TEMPLATE_ID,
    subject: 'Contributor License Agreement',
    signers: [
      {
        email_address: github_email,
        name: 'Contributor',
        role: process.env.SIGNER_ROLE_NAME
      }
    ],
    custom_fields: {  //Merge fields defined in the template
      github_username: github_username,
      github_email: github_email
    }
  }

  // 1st create an embeded signature request using a template
  let response = await hellosign.signatureRequest.createEmbeddedWithTemplate(options);
  let signature_id = response.signature_request.signatures[0].signature_id;

  // 2nd fetch the url to embed specific for the first (and only) signer
  let embedded_resp = await hellosign.embedded.getSignUrl(signature_id);
  return embedded_resp.embedded.sign_url;
}

module.exports = {
  getEmbedURL: getEmbedURL
};
