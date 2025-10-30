'use strict';
import * as database from '@taleofddh/database';
import * as response from '@taleofddh/response';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];

export const findAlbumList = async (event) => {
    let userId = event.requestContext.identity.cognitoIdentityId;
    const params =
        (!userId || userId === undefined) ?
        {
            TableName: table,
            FilterExpression: '#restrictedFlag = :restrictedFlag',
            ExpressionAttributeNames: {
                '#restrictedFlag': 'restrictedFlag',
            },
            ExpressionAttributeValues: {':restrictedFlag': false}
        } : {
            TableName: table
        };
    const albumList = await database.scan(params);
    albumList.sort((a, b) => new Date(b.endDate) - new Date(a.endDate) );
    return response.createResponse(albumList, 200);
};

export const findRestrictedAlbumList = async (event) => {
    const data = JSON.parse(event.body);
    let restrictedFlag  = (data.restrictedFlag === 'true');
    let userId = event.requestContext.identity.cognitoIdentityId;
    const params = {
        TableName: table,
        FilterExpression: '#restrictedFlag = :restrictedFlag',
        ExpressionAttributeNames: {
            '#restrictedFlag': 'restrictedFlag',
        },
        ExpressionAttributeValues: {':restrictedFlag': restrictedFlag}
    }
    const albumList = (restrictedFlag && (!userId || userId === undefined)) ? [] : await database.scan(params);
    if(albumList.length > 0)
        albumList.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    return response.createResponse(albumList, 200);
};

export const updateAlbumViewCount = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    const params = {
        TableName: table,
        Key: {
            "name": data.albumName
        },
        UpdateExpression: "SET #viewCount = #viewCount + :inc",
        ExpressionAttributeNames: {
            "#viewCount": "viewCount"
        },
        ExpressionAttributeValues: { ":inc": 1 },
        ReturnValues: "ALL_NEW"
    }
    const updatedAlbum = (!userId || userId === undefined) ? {} : await database.update(params);
    return response.createResponse(updatedAlbum, 200);
};

export const findAlbumPhotoList = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    let params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'album',
        Key: {
            'name': data.albumName
        }
    };
    const album = await database.get(params);
    params =
        (!userId || userId === undefined) ? {
            TableName: table,
            KeyConditionExpression: '#albumName = :albumName and #restrictedFlag = :restrictedFlag',
            ExpressionAttributeNames: {
                '#albumName': 'albumName',
                '#restrictedFlag': 'restrictedFlag'
            },
            ExpressionAttributeValues: {
                ':albumName': data.albumName,
                ':restrictedFlag': false
            }
        } : {
            TableName: table,
            KeyConditionExpression: '#albumName = :albumName',
            ExpressionAttributeNames: {
                '#albumName': 'albumName'
            },
            ExpressionAttributeValues: {
                ':albumName': data.albumName
            }
        };
    album.photos = await database.query(params);
    album.photos.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(album, 200);
};

export const findPhotoList = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    const params =
        (!userId || userId === undefined) ? {
            TableName: table,
            KeyConditionExpression: '#albumName = :albumName and #restrictedFlag = :restrictedFlag',
            ExpressionAttributeNames: {
                '#albumName': 'albumName',
                '#restrictedFlag': 'restrictedFlag'
            },
            ExpressionAttributeValues: {
                ':albumName': data.albumName,
                ':restrictedFlag': false
            }
        } : {
            TableName: table,
            KeyConditionExpression: '#albumName = :albumName',
            ExpressionAttributeNames: {
                '#albumName': 'albumName'
            },
            ExpressionAttributeValues: {
                ':albumName': data.albumName
            }
        };
    const photoList = await database.query(params);
    photoList.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(photoList, 200);
};

export const findRestrictedPhotoList = async (event) => {
    const data = JSON.parse(event.body);
    let restrictedFlag  = (data.restrictedFlag === 'true');
    let userId = event.requestContext.identity.cognitoIdentityId;
    const params =
        restrictedFlag ? {
            TableName: table,
            KeyConditionExpression: '#albumName = :albumName',
            ExpressionAttributeNames: {
                '#albumName': 'albumName'
            },
            ExpressionAttributeValues: {
                ':albumName': data.albumName
            }
        } : {
            TableName: table,
            KeyConditionExpression: '#albumName = :albumName and #restrictedFlag = :restrictedFlag',
            ExpressionAttributeNames: {
                '#albumName': 'albumName',
                '#restrictedFlag': 'restrictedFlag'
            },
            ExpressionAttributeValues: {
                ':albumName': data.albumName,
                ':restrictedFlag': restrictedFlag
            }
        };
    const photoList = (restrictedFlag && (!userId || userId === undefined)) ? [] : await database.query(params);
    photoList.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(photoList, 200);
};

export const updatePhotoViewCount = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    const params = {
        TableName: table,
        Key: {
            "albumName": data.albumName,
            "name": data.name
        },
        UpdateExpression: "SET #viewCount = #viewCount + :inc",
        ExpressionAttributeNames: {
            "#viewCount": "viewCount"
        },
        ExpressionAttributeValues: { ":inc": 1 },
        ReturnValues: "UPDATED_NEW"
    }
    const updatedPhoto = (!userId || userId === undefined) ? {} : await database.update(params);
    return response.createResponse(updatedPhoto, 200);
};