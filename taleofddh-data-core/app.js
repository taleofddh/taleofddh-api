'use strict'

var MongoClient = require('mongodb').MongoClient;
const decrypt = require("./decrypt");
var core = require('./api');

let atlas_connection_uri;
let cachedDb = null;

exports.handler = async (event, context, callback) => {
    var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];

    if (atlas_connection_uri != null) {
        processEvent(event, context, callback);
    }
    else {
        //comment this line when running from AWS with KMS
        atlas_connection_uri = uri;
        //Uncomment this line when running from AWS with KMS
        //atlas_connection_uri = await decrypt('MONGODB_ATLAS_CLUSTER_URI');
        //console.log('the Atlas connection string is ' + atlas_connection_uri);
        processEvent(event, context, callback);
    }
};

const processEvent = (event, context, callback) => {
    console.log('Calling MongoDB Atlas from AWS Lambda with event: ' + JSON.stringify(event));

    let jsonContents = JSON.parse(JSON.stringify(event));

    //date conversion for grades array
    if(jsonContents.grades != null) {
        for(let i = 0, len=jsonContents.grades.length; i < len; i++) {
            //use the following line if you want to preserve the original dates
            //jsonContents.grades[i].date = new Date(jsonContents.grades[i].date);

            //the following line assigns the current date so we can more easily differentiate between similar records
            jsonContents.grades[i].date = new Date();
        }
    }

    //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
    context.callbackWaitsForEmptyEventLoop = false;
    var database = process.env['DB_NAME'];

    try {
        if (cachedDb == null) {
            console.log('=> connecting to database', database);
            MongoClient.connect(atlas_connection_uri, function (err, client) {
                cachedDb = client.db(database);
                return executeDbQuery(cachedDb, jsonContents, callback)
            });
        }  else {
            executeDbQuery(cachedDb, jsonContents, callback);
        }
    }
    catch (err) {
        console.error('an error occurred', err);
    }
}

const executeDbQuery = (db, json, callback) => {
    let result = {};
    switch(json.action) {
        case 'findActiveMenuList':
            result = core.findActiveMenuList(cachedDb, json, callback);
            break;
        case 'findActivePromotionList':
            result = core.findActivePromotionList(cachedDb, json, callback);
            break;
        case 'findAllTermsAndConditionsList':
            result = core.findAllTermsAndConditionsList(cachedDb, json, callback);
            break;
        case 'findAllPrivacyPolicyList':
            result = core.findAllPrivacyPolicyList(cachedDb, json, callback);
            break;
        case 'findAllFrequentlyAskedQuestionList':
            result = core.findAllFrequentlyAskedQuestionList(cachedDb, json, callback);
            break;
        case 'findCountryByName':
            result = core.findCountryByName(cachedDb, json, callback);
            break;
        case 'findCountryByCode':
            result = core.findCountryByCode(cachedDb, json, callback);
            break;
        default:
            result = core.createDoc(cachedDb, json, callback);
            break;
    }
    return result;
}
