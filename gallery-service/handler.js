'use strict';
const db = require('./db');
const database = require('./dynamodb');
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];

module.exports.findAlbumList = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(albumList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findRestrictedAlbumList = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(albumList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.updateAlbumViewCount = async (event) => {
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
        ReturnValues: "UPDATED_NEW"
    }
    const updatedAlbum = (!userId || userId === undefined) ? {} : await database.update(params);
    return {
        statusCode: 200,
        body: JSON.stringify(updatedAlbum),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findAlbumPhotoList = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(album),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findPhotoList = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(photoList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findRestrictedPhotoList = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(photoList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.updatePhotoViewCount = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(updatedPhoto),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};