// Load the AWS SDK
var AWS = require('aws-sdk');
var converter = AWS.DynamoDB.Converter;

AWS.config.update({
    region: "eu-west-1"
});

module.exports.put = async (params) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.put(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.get = async (params) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.get(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.update = async (params) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.update(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.delete = async (params) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.delete(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.batchWrite = async (params) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.batchWrite(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.batchGet = async (params, table) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.batchGet(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                var response = data.Responses[table].map((item) => {
                    return item;
                })
                resolve(response);
            }
        });
    });
}

module.exports.query = async (params) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.query(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                var response = data.Items.map((item) => {
                    return item;
                })
                resolve(response);
            }
        });
    });
}

module.exports.scan = async (params) => {
    // Create the DynamoDB Document Client
    var documentClient = new AWS.DynamoDB.DocumentClient();

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        documentClient.scan(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                var response = data.Items.map((item) => {
                    return item;
                })
                resolve(response);
            }
        });
    });
}