'use strict';
const db = require('./db');
const storage = require('./storage');
const collection = process.env['COLLECTION_NAME'];
const bucket = process.env['S3_BUCKET'];

module.exports.findLinkList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active}, {"sequence": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findTravelDocuments = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    const folders = await storage.listBucket({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/"});
    let docPromises ={};
    docPromises = folders.map(async (folder) => {
        return {...docPromises, folder: folder, files: await storage.listFolder({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/" + folder + "/"})}
    })
    const docs = await Promise.all(docPromises);
    console.log(docs);
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
}