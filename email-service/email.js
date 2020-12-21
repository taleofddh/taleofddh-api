// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: process.env['REGION']});

module.exports.send = async (toAddress, templateName, templateData, ccAddress) => {
    var ccList = ccAddress ? ccAddress : [];
    // Create sendEmail params
    var params = {
        Destination: { /* required */
            CcAddresses: ccList,
            ToAddresses: [
                toAddress
                /* more items */
            ]
        },
        Source: process.env['FROM_ADDRESS'], /* required */
        Template: templateName,
        TemplateData: templateData,
        ConfigurationSetName: process.env['CONFIG_SET']
    };

    // Create a SES client
    var ses = new AWS.SES({apiVersion: '2010-12-01'});

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        ses.sendTemplatedEmail(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
