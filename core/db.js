const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, BatchWriteCommand, BatchGetCommand, QueryCommand, ScanCommand} = require("@aws-sdk/lib-dynamodb")

// a client can be shared by different commands.
const client = new DynamoDBClient({ region: process.env['REGION'] });
const docClient = DynamoDBDocumentClient.from(client);

module.exports.put = async (params) => {
    const command = new PutCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
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
    const command = new GetCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.Item);
            }
        });
    });
}

module.exports.update = async (params) => {
    const command = new UpdateCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.Attributes);
            }
        });
    });
}

module.exports.delete = async (params) => {
    const command = new DeleteCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
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
    const command = new BatchWriteCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
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
    const command = new BatchGetCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                let response = data.Responses[table].map((item) => {
                    return item;
                })
                resolve(response);
            }
        });
    });
}

module.exports.query = async (params) => {
    const command = new QueryCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                let response = data.Items.map((item) => {
                    return item;
                })
                resolve(response);
            }
        });
    });
}

module.exports.scan = async (params) => {
    const command = new ScanCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        docClient.send(command, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                let response = data.Items.map((item) => {
                    return item;
                })
                resolve(response);
            }
        });
    });
}