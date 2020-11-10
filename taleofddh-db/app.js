'use strict'

var MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
//uncomment this line when running from AWS with KMS
//const decrypt = require("./decrypt");

let atlas_connection_uri;
let cachedDb = null;

exports.handler = (event, context, callback) => {
    processEvent(event, context, callback);
};

const processEvent = async (event, context, callback) => {
    console.log('Calling MongoDB Atlas from AWS Lambda with event: ' + JSON.stringify(event));
    let jsonContents = JSON.parse(JSON.stringify(event));

    const db = await connectToDatabase(context);
    let result = {}
    switch(jsonContents.event) {
        case 'find':
            result = await findDocuments(db, jsonContents, callback);
            break;
        default:
            result = await findDocuments(db, jsonContents, callback);
    }
    return result;
}

const connectToDatabase = async (context) => {
    //comment these lines when running from AWS with KMS
    var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
    atlas_connection_uri = uri;
    //uncomment this line when running from AWS with KMS
    //atlas_connection_uri = await decrypt('MONGODB_ATLAS_CLUSTER_URI');
    //console.log('the Atlas connection string is ' + atlas_connection_uri);

    //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
    context.callbackWaitsForEmptyEventLoop = false;
    var database = process.env['DB_NAME'];

    if (cachedDb) {
        return Promise.resolve(cachedDb);
    }
    console.log('=> connecting to database', database);
    const client = await MongoClient.connect(atlas_connection_uri);
    cachedDb = client.db(database);
    return cachedDb;
}

const findDocuments = async (db, json, callback) =>  {
    //const docs = await db.collection(json.event).find(json.filters).toArray();
    await db.collection(json.collection).find(json.filters).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following documents");
        console.log(docs);
        callback(null, docs);
    });
}
