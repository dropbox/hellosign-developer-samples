var file_id;

$(document).ready(()=>{

  //Initialize HS client
  let hs_client_id = $("#hs_client_id").val();  // Get client value from form
  const hs_client = new window.HelloSign({clientId: hs_client_id});

  // Append the Dropbox button to the form
  let chooser_options = {
    linkType: "preview",
    multiselect: false,
    extensions: ['.pdf', '.doc', '.docx'],
    folderselect: false, 

    success: (files)=>{
      
      preview_url = files[0].link;
      file_id = files[0].id;

      // Clean, populate and present the preview
      $("#dropbox_preview").empty();
      Dropbox.embed({link: preview_url}, $("#dropbox_preview").get(0));
      $('#dropbox_preview').show();

      // Enable button to submit form
      $("#prepare_button").prop('disabled', false);
    }
  }
  let dbx_button = Dropbox.createChooseButton(chooser_options);
  $("#dropbox_chooser").append(dbx_button);

// -- EVENTS --

  // Event triggered when the file is sent for signature
  hs_client.on('send', (data) => {
    $("#success_modal").modal('show');
  });

  // Success modal message dismissed by user
  $("#success_modal_button").click(()=>{
    location.reload();
  });

  $("form").submit(()=>{
    // Get the URL from server and launch the HS embed

    let data = {
      sender_email_address : $("#sender_email").val(),
      file_id : file_id
    }

    $.ajax({
        type: 'POST',
        url: '/create_embed',
        data: data,
        success: function(embed_url){
          let hs_options ={
            skipDomainVerification: true
          }
          hs_client.open(embed_url,hs_options);
        },
        error: function(error){
          console.log(error);
        }
    });
    return false;
  });
});