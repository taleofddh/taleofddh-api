'use strict';
import * as database from '@taleofddh/database';
import * as storage from '@taleofddh/storage';
import * as response from '@taleofddh/response';

const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucket = process.env['S3_BUCKET'];

export const findLinkList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const params = {
        TableName: table,
        FilterExpression: '#active = :active_val',
        ExpressionAttributeNames: {
            '#active': 'active',
        },
        ExpressionAttributeValues: {':active_val': active}
    };
    const links = await database.scan(params);
    links.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(links, 200);
};

export const findTravelDocuments = async (event) => {
    const prefix  = decodeURI(event.pathParameters.prefix);
    const folders = await storage.listBucket({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/"});
    let docPromises ={};
    docPromises = folders.map(async (folder) => {
        return {...docPromises, folder: folder, files: await storage.listFolder({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/" + folder + "/"})}
    })
    const docs = await Promise.all(docPromises);
    return response.createResponse(docs, 200);
}

export const findCountryVisitStatus = async (event) => {
    const params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'visitStatus'
    };
    const statuses = await database.scan(params);
    statuses.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));

    let countryVisitPromises = {}
    console.log(statuses);
    countryVisitPromises = statuses.map(async (item) => {
        const countryParams = {
            TableName: table,
            KeyConditionExpression: '#visitStatus = :visitStatus',
            ExpressionAttributeNames: {
                '#visitStatus': 'visitStatus'
            },
            ExpressionAttributeValues: {
                ':visitStatus': item.status
            }
        }
        return {...countryVisitPromises, _id: item._id, sequence: item.sequence, status: item.status, color: item.color, backgroundColor: item.backgroundColor, countries: await database.query(countryParams)}
    })
    const countryVisitList = await Promise.all(countryVisitPromises);
    return response.createResponse(countryVisitList, 200);
}

export const getTravelDocument = async (event) => {
    const prefix  = decodeURI(event.pathParameters.prefix) + '/' + decodeURI(event.pathParameters.folder);
    const file = decodeURI(event.pathParameters.file);
    let object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + file});
    return {
        isBase64Encoded: true,
        statusCode: 200,
        body: JSON.stringify(await object.Body.transformToString('base64')),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": object.ContentType,
            "Content-Disposition": "attachment; filename=" + file,
        }
    };
}
