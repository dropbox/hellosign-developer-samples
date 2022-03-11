package com.hellosign.javademo.service;

import com.hellosign.sdk.resource.support.Signature;
import org.springframework.stereotype.Service;
import com.hellosign.sdk.HelloSignClient;
import com.hellosign.sdk.HelloSignException;
import com.hellosign.sdk.resource.EmbeddedRequest;
import com.hellosign.sdk.resource.EmbeddedResponse;
import com.hellosign.sdk.resource.SignatureRequest;
import com.hellosign.sdk.resource.TemplateSignatureRequest;

@Service
public class HelloSignService {

	public String sendEmbeddedSignatureRequest() throws HelloSignException {

		TemplateSignatureRequest request = new TemplateSignatureRequest();
		request.setTemplateId("<TEMPLATE_ID_FOR_DOCUMENT>");
		request.setSubject("Please review and Sign");
		request.setMessage("Please review and Sign");
		request.setSigner("Client", "<RECIPIENT_EMAIL_ADDRESS>","<RECIPIENT_NAME>");
		request.setTestMode(true); 

		String clientId = "<CLIENT_ID_OF_YOUR_APP>";
		EmbeddedRequest embedReq = new EmbeddedRequest(clientId, request);
		//Create a HelloSign Client
		HelloSignClient helloSignclient = new HelloSignClient(
				"<YOUR_API_TOKEN_KEY>");
		//create new Embedded Signature Request
		SignatureRequest newRequest = (SignatureRequest) helloSignclient.createEmbeddedRequest(embedReq);

		Signature signature = newRequest.getSignature("<RECIPIENT_EMAIL_ADDRESS>","<RECIPIENT_NAME>");
		String signatureId =  signature.getId();
		EmbeddedResponse response = helloSignclient.getEmbeddedSignUrl(signatureId);
		String url = response.getSignUrl();

		return url;
	}

}
