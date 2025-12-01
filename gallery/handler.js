'use strict';
import * as array from '@taleofddh/array';
import * as database from '@taleofddh/database';
import * as distribution from '@taleofddh/distribution';
import * as date from '@taleofddh/date';
import * as response from '@taleofddh/response';
import * as secret from '@taleofddh/secret';
import * as storage from '@taleofddh/storage';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucketName = process.env['S3_MEDIA_BUCKET'];
const source = "gallery";

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

export const findAlbumCategories = async (event) => {
    let historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, #name, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#startDateTime': "startDateTime",
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const albums = await database.scan(params);

    let categories = array.distinctValues(albums, "category");

    return response.createResponse(categories, 200);
}

export const findHistoricalAlbumCategories = async (event) => {
    const historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "#name, category, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#startDateTime': 'startDateTime',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        },
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.category.localeCompare(b.category)));

    const albumCategories = array.distinctValues(albums, "category");
    const prefix = getPrefix(true, 'images', source);
    const signatureParams = await getSignatureParameters(prefix, 30);
    const albumCategoryList = albumCategories.map((category) => {
        return {
            name: category,
            signedUrl: distribution.getSignedUrlWithPolicy(
                {...signatureParams, url: prefix + category.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
            )
        }
    });

    return response.createResponse(albumCategoryList, 200);
};

export const findHistoricalAlbumSubCategories = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #name, startDateTime, endDateTime",
        FilterExpression: '#category = :category and #startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#category': 'category',
            '#startDateTime': "startDateTime",
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.subCategory.localeCompare(b.subCategory)));

    const albumSubCategories = array.distinctValues(albums, "subCategory");
    const prefix = getPrefix(true,'images', source, category);
    const signatureParams = await getSignatureParameters(prefix, 1440);
    const albumSubCategoryList = albumSubCategories.map((subCategory) => {
        return {
            name: subCategory,
            signedUrl: distribution.getSignedUrlWithPolicy(
                {...signatureParams, url: prefix + subCategory.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
            )
        }
    });

    return response.createResponse(albumSubCategoryList, 200);
};

export const findAlbumCategorySubCategories = async (event) => {
    let historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #name, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#startDateTime': "startDateTime",
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const albums = await database.scan(params);

    let categorySubCategories = array.distinctValues(albums, "category").map((item) => {
        let categorizedAlbums = albums.filter((item1) => {
            return item1.category === item;
        });
        return {category: item, subCategories: array.distinctValues(categorizedAlbums, "subCategory")};
    })

    return response.createResponse(categorySubCategories, 200);
}

export const findHistoricalAlbumCollections = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const subCategory = decodeURI(event.pathParameters.subCategory);
    const historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime",
        FilterExpression: '#category = :category and #subCategory = :subCategory and #startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#category': 'category',
            '#subCategory': 'subCategory',
            '#startDateTime': "startDateTime",
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':subCategory': subCategory,
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.collection.localeCompare(b.collection)));

    const albumCollections = array.distinctValues(albums, "collection");
    const prefix = getPrefix(true, 'images', source, category, subCategory);
    const signatureParams = await getSignatureParameters(prefix, 1440);
    const albumCollectionList = albumCollections.map((collection) => {
        return {
            name: collection,
            signedUrl: distribution.getSignedUrlWithPolicy(
                {...signatureParams, url: prefix + collection.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
            )
        }
    });

    return response.createResponse(albumCollectionList, 200);
};

export const findAlbumCategorySubCategoryCollections = async (event) => {
    let historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#startDateTime': "startDateTime",
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const albums = await database.scan(params);

    let categorySubCategoryCollections = array.distinctValues(albums, "category").map((item) => {
        let categorizedAlbums = albums.filter((item1) => {
            return item1.category === item;
        });
        return array.distinctValues(categorizedAlbums, "subCategory").map((item1) => {
            let subCategorizedCollections = albums.filter((item2) => {
                return item2.subCategory === item1 && item2.category === item;
            });
            return {category: item, subCategory: item1, collections: array.distinctValues(subCategorizedCollections, "collection")};
        })
    })

    return response.createResponse(categorySubCategoryCollections, 200);
}

export const findAlbumHistoricalNames = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const subCategory = decodeURI(event.pathParameters.subCategory);
    const collection = decodeURI(event.pathParameters.collection);
    const historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime, photoCount, viewCount",
        FilterExpression: '#category = :category and #subCategory = :subCategory and #collection = :collection and #startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#category': 'category',
            '#subCategory': 'subCategory',
            '#startDateTime': "startDateTime",
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':subCategory': subCategory,
            ':collection': collection,
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.name.localeCompare(b.name)));

    const prefix = getPrefix(true, 'images', source, category, subCategory, collection);
    const signatureParams = await getSignatureParameters(prefix, 1440);
    const albumList = albums.map((album) => {
        return {
            ...album,
            signedUrl: distribution.getSignedUrlWithPolicy(
                {...signatureParams, url: prefix + album.name.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
            )
        }
    });

    return response.createResponse(albumList, 200);
};

export const findAlbumCategorySubCategoryCollectionNames = async (event) => {
    let historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate and #production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#startDateTime': "startDateTime",
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const albums = await database.scan(params);

    let categorySubCategoryCollectionNames = array.distinctValues(albums, "category").map((item) => {
        let categorizedAlbums = albums.filter((item1) => {
            return item1.category === item;
        });
        return array.distinctValues(categorizedAlbums, "subCategory").map((item1) => {
            let subCategorizedCollections = albums.filter((item2) => {
                return item2.subCategory === item1 && item2.category === item;
            });
            return array.distinctValues(subCategorizedCollections, "collection").map((item2) => {
                let collectionNames = albums.filter((item3) => {
                    return item3.collection === item2 && item3.subCategory === item1 && item3.category === item;
                });
                return {category: item, subCategory: item1, collection: item2, names: array.distinctValues(collectionNames, "name")};
            })
        })
    })

    return response.createResponse(categorySubCategoryCollectionNames, 200);
}

export const findAlbum = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const subCategory = decodeURI(event.pathParameters.subCategory);
    const collection = decodeURI(event.pathParameters.collection);
    const name = decodeURI(event.pathParameters.name);
    let currentDate = new Date();
    const params = {
        TableName: table,
        ProjectionExpression: "id, category, subCategory, #collection, #name, startDateTime, endDateTime, description, titlePhoto, albumLocation, #searchName, photoCount, viewCount, production",
        FilterExpression: '#searchName = :searchName and #collection = :collection and #subCategory = :subCategory and #category = :category and #startDateTime < :currentDate',
        ExpressionAttributeNames: {
            "#name": 'name',
            '#collection': 'collection',
            '#subCategory': 'subCategory',
            '#category': 'category',
            '#startDateTime': "startDateTime",
            '#searchName': 'searchName'
        },
        ExpressionAttributeValues: {
            ':searchName': name.toUpperCase(),
            ':collection': collection,
            ':subCategory': subCategory,
            ':category': category,
            ':currentDate': date.dateTimeFullFormatToString(currentDate)
        }
    };
    const albums = await database.scan(params);

    const prefix1 = getPrefix(true, 'images', source, category, subCategory, collection);
    let signatureParams1 = await getSignatureParameters(prefix1, 1440);

    const prefix2 = getPrefix(false, 'images', source, category, subCategory, collection, name);
    let photos = await storage.listFolder({ Bucket: bucketName, Delimiter: '/', Prefix: prefix2 });
    const signatureParams2 = await getSignatureParameters(process.env['MEDIA_PROTECTED_HOST'] + prefix2, 1440);

    const prefix3 = getPrefix(false, 'videos', source, category, subCategory, collection, name);
    let videos = await storage.listFolder({ Bucket: bucketName, Delimiter: '/', Prefix: prefix3 });
    const signatureParams3 = await getSignatureParameters(process.env['MEDIA_PROTECTED_HOST'] + prefix3, 1440);

    const albumList = albums.map((album) => {
        if (album.name === name) {
            return {
                ...album,
                signedUrl: distribution.getSignedUrlWithPolicy(
                    {...signatureParams1, url: prefix1 + album.name.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
                ),
                photoList: photos.filter((item) => { return item !== ''; }).map((item1) => {
                    return {
                        name: item1,
                        signedPhotoUrl: distribution.getSignedUrlWithPolicy(
                            {...signatureParams2, url: process.env['MEDIA_PROTECTED_HOST'] + '/'  + prefix2 + item1}
                        )}
                }),
                videoList: videos.filter((item) => { return item !== ''; }).map((item1) => {
                    return {
                        name: item1,
                        signedVideoUrl: distribution.getSignedUrlWithPolicy(
                            {...signatureParams3, url: process.env['MEDIA_PROTECTED_HOST'] + '/'  + prefix3 + item1}
                        )}
                })
            }
        }
    });
    console.log(JSON.stringify(albumList));

    return response.createResponse(albumList[0], 200);
};

const getPrefix = (isHost = true, type = 'images', source, category, subCategory, collection, name) => {
    return (
        (isHost ? process.env['MEDIA_PROTECTED_HOST'] + '/' : '') + 'protected/' + type + '/' + source + '/'
        + (category ? category.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
        + (subCategory ? subCategory.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
        + (collection ? collection.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
        + (name ? name.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
    );
}

const getSignatureParameters = async (prefix, minutesToExpire) => {
    const signerPrivateKey = await secret.getSecretValue({SecretId: process.env['SIGNER_PRIVATE_KEY']});
    return distribution.getSignatureParameters(
        process.env['CLOUDFRONT_PUBLIC_KEY_ID'],
        signerPrivateKey,
        true,
        prefix,
        minutesToExpire
    );
}