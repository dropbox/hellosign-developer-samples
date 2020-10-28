By Ruben Rincon  
October, 2020

# Background
This code sample shows how to use the [Dropbox](https://www.dropbox.com/developers) [API](https://www.dropbox.com/developers) and [HelloSign API](https://www.hellosign.com/products/api?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) to create a seamless [embedded requesting](https://app.hellosign.com/api/embeddedRequestingWalkthrough?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) workflow. Embedded requesting allows you to have users create and send signature requests on your site in an iFrame.  

In this sample workflow, users are able to select a file from their Dropbox account, preview it, prepare it, and send it for signature, without ever leaving the sample web page. [HelloSign](https://www.hellosign.com/?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) will handle all email notifications and, once all the requested signatures are executed, the signed document will be **automatically uploaded to the same Dropbox account in the same folder as the original file**. The complete embedded requesting workflow is shown in the following flowchart:


![Workflow implemented in the code sample](https://github.com/dropbox/HelloSign-Developer-Samples/blob/master/hellosign-embed-with-dbx-file/public/images/workflow-chart.png?raw=true)


If you simply want to see a screen capture of this workflow running, just scroll down to the bottom of this page.

This code sample covers both the client-side and the server-side of our app, which are described below:

## Client-side

The client allows the user to pick a file from Dropbox and preview it. Once the user decides to prepare a file for eSignature, it will fetch an embeddable URL from the server and present it within an iFrame.

The client uses the following tech stack:

- Dropbox [Chooser](https://www.dropbox.com/developers/chooser), facilitating the process of picking a file from Dropbox, and the Dropbox [Embedder](https://www.dropbox.com/developers/embedder), which allows to preview it directly in the web page
- The [hellosign-embedded](https://github.com/hellosign/hellosign-embedded/wiki/CDN-Links) client-side library, allowing developers to embed the document preparation experience in an iFrame
- jQuery for HTML manipulation and event handling
- Bootstrap 4 as the CSS framework

## Server-side
The server receives a Dropbox `file_id` from the client and gets additional information using the Dropbox API, then obtains an embeddable preparation URL with the [HelloSign API](https://www.hellosign.com/products/api?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) and sends it back to the client.  Additionally, the sample server is also listening for [HelloSign callback events](https://app.hellosign.com/api/reference#Callbacks?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) indicating that the file has been fully executed, triggering a direct HelloSign to Dropbox file upload. In order to upload the signed file to the same location in Dropbox as the source file, we pass the `file_id` as custom metadata to the HelloSign API calls. This `file_id` is returned to our server in each callback event during the signing process.

The server uses the following tech stack:

- [Node.](https://nodejs.org/en/)[js](https://nodejs.org/en/) and [Express](https://expressjs.com/). The minimum version required for Node.JS is 8.2.1
- [Handlebars](https://handlebarsjs.com/), which is a minimalist template engine that allows us to load simple HTML within an .hbs file, and pass JavaScript objects to it.
- The [Dropbox JavaScript SDK](https://github.com/dropbox/dropbox-sdk-js) and the [HelloSign NodeJS SDK](https://www.npmjs.com/package/hellosign-sdk) to communicate with either service. 
# Preparing your development environment 

First, clone or download this code repository into your local machine.

Make sure Node.js is installed on your machine, if that is not the case, you can simply go to [Nodejs.org](https://nodejs.org/en/) and get the latest version. At the time of building this sample code, we have used version 15.0.0. The minimum version required to support this sample code is  8.2.1.

This code sample is composed of the following files:

- **package.json:** list of dependencies used upon installation
- **app.js:** entry point and application configuration
- **controller.js:** server-side logic
- **views/index.hbs:** Handlebars template containing the HTML form sent to the user 
- **public/javascripts/page_script.js:** client-side script containing logic for HTML and event handling manipulation
- **public/****s****tylesheets/style.css:** client-side stylesheet 

Now, you need to modify the **.env** file in the root of the project (where the package.json file is) and paste the content below (You will be replacing the values with with your information from the Dropbox and HelloSign configuration pages in the following sections)

**.env**

    hs_client_id="<HelloSign Client ID from the App Settings>"
    hs_api_key="<HelloSign API Key>"
    dropbox_app_key="<Dropbox App Key from App Console>"
    dbx_access_token="<A valid Dropbox access token>"
# Setting up the Dropbox App

Before you can successfully run the code from this repository, you first need to have a Dropbox application with *Full Dropbox* access. If you don’t have an application, create one in the Dropbox developer [App Console](https://www.dropbox.com/developers/apps). 

While setting up your app, go to the *Permissions* tab and select the scopes of `files.content.read` and `files.content.write`. 

Next, go to the *Settings* tab of your application and complete the following steps:

- Register the domain where you’ll be calling the client side library by adding **localhost** in the Chooser / Saver / Embedder domains field.
- Copy the **App Key** into your .env file (`dropbox_app_key`). You’ll need it in order to load the client-side library in your sample app.
- Click the “Generate” button to create an **access token** and copy it into your .env file (`dbx_access_token`). Tokens default to short-lived, which last around 4 hours. We recommend reviewing our [OAuth Guide](https://www.dropbox.com/lp/developers/reference/oauth-guide) to determine the right authorization model for your needs. 
![Dropbox app settings page](https://github.com/dropbox/HelloSign-Developer-Samples/blob/master/hellosign-embed-with-dbx-file/public/images/dbx-app-settings.png?raw=true)

# Setting up the HelloSign API app

You will also need to have a [HelloSign API](https://www.hellosign.com/products/api?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) app configured. This API provides a **Test** mode which allows users to make non-legally binding signature requests for testing purposes for free and without having to enter a credit card. Making valid signature requests calls requires a paid plan. For more information visit the [HelloSign API](https://www.hellosign.com/products/api) website. 

To configure the HelloSign API app: 

1. [Create an account](https://app.hellosign.com/?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) if you don't already have one and retrieve your **API Key** from the [settings page](https://app.hellosign.com/home/myAccount#api?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis). Copy this value into the .env file (`hs_api_key`)

2. [Create an API app](https://app.hellosign.com/oauth/createAppForm?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) (login required). You will need to enter a domain. If you don’t have a domain, just enter any sample domain like *example.com* as we are only going to be using Test mode and bypassing domain validation. Note that a production app requires this validation to be successful and client library will only work on a registered domain. 

3. Leave the Event callback URL empty for the moment, we will come back later to set it up.

After creating the app, you'll be presented a **Client ID.** Copy the value into the .env file (`hs_client_id`).

# Running the code

Having the Dropbox and the HelloSign apps properly configured and all the values copied into the .env file, we can proceed to run the code.

Open a terminal and at the project level (where the package.json file is located) and install the dependencies using: `npm install`

And then run the server: `npm start`

When the server is running, visit [http://localhost:3000](http://localhost:3000/) and you'll see a screen to add a sender email, as well as pick and preview a file from Dropbox.

![Selected file preview created with the Embedder](https://github.com/dropbox/HelloSign-Developer-Samples/blob/master/hellosign-embed-with-dbx-file/public/images/embedded-file.png?raw=true)

The Sender email identifies the person requesting the signature. In this sample, you can use any value, but in in a production scenario, you’re responsible for validating the identity of the user first. You can use an alias for easy testing (i.e. dave+hellosignapptest@example.com).

Once you click *Prepare for signature*, the embedded preparation flow will be started. You will be first asked to add names and emails of the document’s signers (you can also use email aliases here for easy testing), and then you will be able to manually place fields such as signature locations, initials or dates into the document (see screenshot below). Finally you can add a custom message and submit your document for signature. Once submitted, HelloSign will take care of notifying the signers via email and collect the respective signatures.

![Embedded preparation flow in an iFrame](https://github.com/dropbox/HelloSign-Developer-Samples/blob/master/hellosign-embed-with-dbx-file/public/images/hs-embedder-tool.png?raw=true)


# Setting up the HelloSign event callbacks

Up to this point, you can pick a file from Dropbox, preview it, and send it for signature. But we want our app to automatically save the final document back to Dropbox once the signatures are completed. This is accomplished by using [HelloSign callbacks](https://app.hellosign.com/api/eventsAndCallbacksWalkthrough?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis), which are event notifications sent to our server anytime the state of a signature request has changed. 

The sample contains logic for managing HelloSign callbacks, but you’ll need to configure in HelloSign a valid event callback URL. Only valid https URLs can be registered, so a quick way to test this sample code is using [n](https://ngrok.com/download)[grok](https://ngrok.com/download), which allows you to tunnel your localhost to the web and opens endpoints for Https traffic.

Once installed, run `ngrok http 3000` and copy the https address to use in your sample. 

![Example of ngrok running](https://github.com/dropbox/HelloSign-Developer-Samples/blob/master/hellosign-embed-with-dbx-file/public/images/ngrok-running.png?raw=true)


You can use the server endpoint `/hsevents` (implemented in the code sample) to handle HelloSign events. To configure it, go to your [HelloSign Application page](https://app.hellosign.com/home/myAccount#api?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis), click on Edit and enter the URL in the *Event callback* field as shown in the image below, it should look like this  `https://<ngrokdomain>/hsevents`. Then, click on *TEST* and after the test is successful,  scroll down click *Update* *Application* to save the configuration.

![Event callback configuration](https://github.com/dropbox/HelloSign-Developer-Samples/blob/master/hellosign-embed-with-dbx-file/public/images/callback-register.png?raw=true)


With this configured, you should be receiving a callback from HelloSign every time there’s a change in a signature status for your app. When the server gets a `signature_request_all_signed` event, it will trigger an upload of the completed file from HelloSign into Dropbox.

If everything worked, then you should be able to see the callback events in your console (or errors if something went wrong). Once the Dropbox upload is complete, the path of the signed document will also be displayed into the console. Visit that location in Dropbox and you should find the signed version of the source file. Great work! 

![Node log after successful embedded signing workflow](https://github.com/dropbox/HelloSign-Developer-Samples/blob/master/hellosign-embed-with-dbx-file/public/images/success-log.png?raw=true)

You're all set now, you can find more information about callbacks in the [HelloSign documentation](https://app.hellosign.com/api/reference#Callbacks?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis)!

# Screen capture

Want to see the completed sample in action? Here’s a screen capture of the code sample running

[https://www.dropbox.com/s/fb0c6k1vlt9ne1n/hellosign%20embeded%20request.mov?dl=0](https://www.dropbox.com/s/fb0c6k1vlt9ne1n/hellosign%20embeded%20request.mov?dl=0) 

# What to do from here

This code sample is intended for test and API exploration purposes, If you want to build upon this code sample, here’s a list of important considerations that you will need to make:

- To allow any Dropbox account to work, you’ll need to implement an authorization flow using OAuth. More information in the [Dropbox OAuth](https://www.dropbox.com/lp/developers/reference/oauth-guide) [G](https://www.dropbox.com/lp/developers/reference/oauth-guide)[uide](https://www.dropbox.com/lp/developers/reference/oauth-guide).
- In a production scenario, you need to validate the identity of the sender (person submitting the signature request).
- HelloSign API apps that use embedded flows require going through an app approval process. More information in the HelloSign API [Embedded Requesting](https://app.hellosign.com/api/embeddedRequestingWalkthrough?utm_medium=referral&utm_source=github&utm_campaign=api-devrel-10-26-20&utm_content=embedded-requesting-workflows-using-the-hellosign-and-dropbox-apis) guide.
- Finally, a production application should properly handle Dropbox errors. More information in the [Error Handling Guide](https://www.dropbox.com/lp/developers/reference/error-handling-guide).
# License

Apache 2.0

