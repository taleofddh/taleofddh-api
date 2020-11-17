const MongoClient = require('mongodb').MongoClient;
//uncomment this line when running from AWS with KMS
const secret = require("./secret");

let atlas_connection_uri;
let cachedDb = null;

module.exports.get = async function () {
    //Getting Secret Response for Key
    var response = JSON.parse(await secret('MONGODB_ATLAS_CLUSTER_URI'));
    atlas_connection_uri = response.MONGODB_ATLAS_CLUSTER_URI;
    //console.log('the Atlas connection string is ' + atlas_connection_uri);

    //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
    var database = process.env['DB_NAME'];

    if (cachedDb) {
        return Promise.resolve(cachedDb);
    }
    const client = await MongoClient.connect(atlas_connection_uri);
    cachedDb = client.db(database);
    return cachedDb;
};

module.exports.findDocument = async function (db, collection, query) {
    return await db.collection(collection).findOne(query);
};

module.exports.findDocuments = async function (db, collection, query, sort) {
    return await sort ? db.collection(collection).find(query).sort(sort).toArray() : db.collection(collection).find(query).toArray();
};