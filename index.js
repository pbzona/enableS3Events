const AWS = require('aws-sdk');
const S3 = new AWS.S3();

exports.handler = (event, context) => {

  console.log(`REQUEST RECEIVED:\n + ${JSON.stringify(event)}`);

  if (event.RequestType !== 'Create') {
    sendResponse(event, context, 'SUCCESS');
    return;
  }

  let responseStatus = 'FAILED';
  let responseData = {};

  const bucketString = event.ResourceProperties.bucketString;
  const lambdaFunction = event.ResourceProperties.lambdaFunction;

  const params = {
    asdf
    Bucket: getBucketName(bucketString),
    NotificationConfiguration: {
      LambdaFunctionConfigurations: [{
        Events: ['s3:ObjectCreated:*'],
        LambdaFunctionArn: lambdaFunction
      }]
    }
  }

  S3.putBucketNotificationConfiguration(params, (err, data) => {
    if (err) {
      responseData = { Error: 'Failed to create notification configuration' }
      console.log(`${responseData.Error}:\n ${err}`);
    }
    responseStatus = 'SUCCESS';
    responseData = data;

    sendResponse(event, context, responseStatus, responseData);
  });


};

const getBucketName = (name) => {
  S3.listBuckets({}, (err, data) => {
    if (err) {
      return err;
    }
    let result;
    data.Buckets.forEach(bucket => {
      if (bucket.Name.match(name)) {
        result = bucket.Name;
      }
    });
    return result;
  });
}

const sendResponse = (event, context, responseStatus, responseData) => {
  var responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });

  console.log(`RESPONSE BODY:\n ${responseBody}`);

  const https = require('https');
  const url = require('url');

  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length
    }
  };

  console.log('SENDING RESPONSE...\n');

  const request = https.request(options, function(response) {
    console.log('STATUS: ' + response.statusCode);
    console.log('HEADERS: ' + JSON.stringify(response.headers));
    context.done();
  });

  request.on('error', function(error) {
    console.log('sendResponse Error:' + error);
    context.done();
  });

  request.write(responseBody);
  request.end();
}
