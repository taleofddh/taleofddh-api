'use strict';
import * as array from '@taleofddh/array';
import * as database from '@taleofddh/database';
import * as distribution from '@taleofddh/distribution';
import * as date from '@taleofddh/date';
import * as response from '@taleofddh/response';
import * as secret from '@taleofddh/secret';
import * as storage from '@taleofddh/storage';
import { v6 as uuidv6 } from 'uuid';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucketName = process.env['S3_MEDIA_BUCKET'];
const source = "gallery";
const SIGNED_URL_EXPIRY_MINUTES = 30;

export const createOrUpdateAlbum = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;

    let album;
    const existingAlbum = (!userId || false) ? {} : await getAlbum(data.name, data.startDateTime);
    if(!existingAlbum) {
        album = await createAlbum(data, userId);
    } else {
        album = await updateAlbum(data, userId);
    }

    return response.createResponse(album, 200);
}

export const findAlbum = async (event) => {
    const name = decodeURI(event.pathParameters.name);
    const startDateTime = decodeURI(event.pathParameters.startDateTime);
    let userId = event.requestContext.identity.cognitoIdentityId;

    const album = (!userId || false) ? {} : await getAlbum(name, startDateTime);

    return response.createResponse(album, 200);
}

export const findAlbums = async (event) => {
    const params = {
        TableName: table,
        ProjectionExpression: "id, category, subCategory, #collection, #name, startDateTime, endDateTime, description, titlePhoto, albumLocation, #searchName, photoCount, viewCount, production",
        FilterExpression: '#production = :production',
        ExpressionAttributeNames: {
            "#name": 'name',
            '#collection': 'collection',
            '#searchName': 'searchName',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':production': true
        }
    }
    const albums = await database.scan(params);

    return response.createResponse(albums, 200);
}

const getAlbum = async (name, startDateTime) => {
    const params = {
        TableName: table,
        Key: {
            "name": name,
            "startDateTime": startDateTime
        }
    }
    return await database.get(params);
}

const createAlbum = async (data, userId) => {
    const options = {
        msecs: new Date(data.startDateTime).getTime()
    }
    const params = {
        TableName: table,
        Item: {
            "name": data.name,
            "startDateTime": data.startDateTime,
            "id": uuidv6(options),
            "endDateTime": data.endDateTime,
            "category": data.category,
            "subCategory": data.subCategory,
            "collection": data.collection,
            "production": data.production,
            "description": data.description,
            "photoCount": parseInt(data.photoCount),
            "viewCount": parseInt(data.viewCount),
            "titlePhoto": data.titlePhoto,
            "restrictedFlag": data.restrictedFlag,
            "defaultFlag": data.defaultFlag,
            "searchName": data.name.toUpperCase(),
            "createDate": new Date().toDateString(),
            "updateDate": new Date().toDateString()
        }
    }
    const res = (!userId || false) ? {} : await database.put(params);

    return await getAlbum(data.name, data.startDateTime);
}

const updateAlbum = async(data, userId) => {
    const params = {
        TableName: table,
        Key: {
            "name": data.name,
            "startDateTime": data.startDateTime
        },
        UpdateExpression: "SET " +
                "#collection = :collection, " +
                "#endDateTime = :endDateTime, " +
                "#category = :category, " +
                "#subCategory = :subCategory, " +
                "#production = :production, " +
                "#description = :description, " +
                "#photoCount = :photoCount, " +
                "#viewCount = :viewCount" +
                "updateDate = :updateDate",
        ExpressionAttributeNames: {
            "#collection": "collection",
            "#endDateTime": "endDateTime",
            "#category": "category",
            "#subCategory": "subCategory",
            "#production": "production",
            "#description": "description",
            "#photoCount": "photoCount",
            "#viewCount": "viewCount",
            "#updateDate": "updateDate"
        },
        ExpressionAttributeValues: {
            ":collection": data.collection,
            ":endDateTime": data.endDateTime,
            ":category": data.category,
            ":subCategory": data.subCategory,
            ":production": data.production,
            ":description": data.description,
            ":photoCount": parseInt(data.photoCount),
            ":viewCount": parseInt(data.viewCount),
            ":updateDate": new Date().toDateString()
        },
        ReturnValues: "ALL_NEW"
    }
    const res = (!userId || false) ? {} : await database.update(params);

    return await getAlbum(data.name, data.startDateTime);
}

export const updateAlbumViewCount = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    const params = {
        TableName: table,
        Key: {
            "name": data.name,
            "startDateTime": data.startDateTime
        },
        UpdateExpression: "SET #viewCount = #viewCount + :inc",
        ExpressionAttributeNames: {
            "#viewCount": "viewCount"
        },
        ExpressionAttributeValues: { ":inc": 1 },
        ReturnValues: "ALL_NEW"
    }
    const updatedAlbum = (!userId || false) ? {} : await database.update(params);
    return response.createResponse(updatedAlbum, 200);
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
    const updatedPhoto = (!userId || false) ? {} : await database.update(params);
    return response.createResponse(updatedPhoto, 200);
};

export const findRecentAlbumNames = async (event) => {
    const historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime, photoCount, viewCount",
        FilterExpression: '#startDateTime >= :historicalDate and #production = :production',
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
    albums.sort((a,b) => (a.startDateTime > b.startDateTime) ? 1 : ((b.startDateTime > a.startDateTime) ? -1 : 0));

    const signerPrivateKey = await getSignerPrivateKey();

    const albumList = albums.map((album) => {
        const prefix = getPrefix(true, 'images', source, album.category, album.subCategory, album.collection);
        return {
            ...album,
            signedUrl: signFile(prefix + toSlug(album.name) + '.jpg', signerPrivateKey)
        }
    });

    return response.createResponse(albumList, 200);

};

export const findHistoricalAlbumCategories = async (event) => {
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "#name, category, startDateTime, endDateTime",
        FilterExpression: '#production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':production': true
        },
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.category.localeCompare(b.category)));

    const albumCategories = array.distinctValues(albums, "category");
    const prefix = getPrefix(true, 'images', source);
    const signerPrivateKey = await getSignerPrivateKey();
    const albumCategoryList = albumCategories.map((category) => {
        return {
            name: category,
            signedUrl: signFile(prefix + toSlug(category) + '.jpg', signerPrivateKey)
        }
    });

    return response.createResponse(albumCategoryList, 200);
};

export const findAlbumCategories = async (event) => {
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, #name, startDateTime, endDateTime",
        FilterExpression: '#production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':production': true
        }
    };
    const albums = await database.scan(params);

    let categories = array.distinctValues(albums, "category");

    return response.createResponse(categories, 200);
};

export const findHistoricalAlbumSubCategories = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #name, startDateTime, endDateTime",
        FilterExpression: '#category = :category and #production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#category': 'category',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':production': true
        }
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.subCategory.localeCompare(b.subCategory)));

    const albumSubCategories = array.distinctValues(albums, "subCategory");
    const prefix = getPrefix(true,'images', source, category);
    const signerPrivateKey = await getSignerPrivateKey();
    const albumSubCategoryList = albumSubCategories.map((subCategory) => {
        return {
            name: subCategory,
            signedUrl: signFile(prefix + toSlug(subCategory) + '.jpg', signerPrivateKey)
        }
    });

    return response.createResponse(albumSubCategoryList, 200);
};

export const findAlbumCategorySubCategories = async (event) => {
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #name, startDateTime, endDateTime",
        FilterExpression: '#production = :production',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
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
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime",
        FilterExpression: '#category = :category and #subCategory = :subCategory and #production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#category': 'category',
            '#subCategory': 'subCategory',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':subCategory': subCategory,
            ':production': true
        }
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.collection.localeCompare(b.collection)));

    const albumCollections = array.distinctValues(albums, "collection");
    const prefix = getPrefix(true, 'images', source, category, subCategory);
    const signerPrivateKey = await getSignerPrivateKey();
    const albumCollectionList = albumCollections.map((collection) => {
        return {
            name: collection,
            signedUrl: signFile(prefix + toSlug(collection) + '.jpg', signerPrivateKey)
        }
    });

    return response.createResponse(albumCollectionList, 200);
};

export const findAlbumCategorySubCategoryCollections = async (event) => {
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime",
        FilterExpression: '#production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
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
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime, photoCount, viewCount",
        FilterExpression: '#category = :category and #subCategory = :subCategory and #collection = :collection and #production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#category': 'category',
            '#subCategory': 'subCategory',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':subCategory': subCategory,
            ':collection': collection,
            ':production': true
        }
    };
    const albums = await database.scan(params);
    albums.sort((a,b) => (a.name.localeCompare(b.name)));

    const prefix = getPrefix(true, 'images', source, category, subCategory, collection);
    const signerPrivateKey = await getSignerPrivateKey();
    const albumList = albums.map((album) => {
        return {
            ...album,
            signedUrl: signFile(prefix + toSlug(album.name) + '.jpg', signerPrivateKey)
        }
    });

    return response.createResponse(albumList, 200);
};

export const findAlbumCategorySubCategoryCollectionNames = async (event) => {
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime",
        FilterExpression: '#production = :production',
        ExpressionAttributeNames: {
            '#collection': 'collection',
            '#name': 'name',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
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

export const findAlbumWithMedia = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const subCategory = decodeURI(event.pathParameters.subCategory);
    const collection = decodeURI(event.pathParameters.collection);
    const name = decodeURI(event.pathParameters.name);
    const params = {
        TableName: table,
        ProjectionExpression: "id, category, subCategory, #collection, #name, startDateTime, endDateTime, description, titlePhoto, albumLocation, #searchName, photoCount, viewCount, production",
        FilterExpression: '#searchName = :searchName and #collection = :collection and #subCategory = :subCategory and #category = :category',
        ExpressionAttributeNames: {
            "#name": 'name',
            '#collection': 'collection',
            '#subCategory': 'subCategory',
            '#category': 'category',
            '#searchName': 'searchName'
        },
        ExpressionAttributeValues: {
            ':searchName': name.toUpperCase(),
            ':collection': collection,
            ':subCategory': subCategory,
            ':category': category
        }
    };
    const albums = await database.scan(params);

    const album = albums.find((item) => item.name === name);
    if (!album) {
        return response.createNotFoundResponse('Album', name);
    }

    const signerPrivateKey = await getSignerPrivateKey();

    const coverPrefix = getPrefix(true, 'images', source, category, subCategory, collection);

    const photoPrefix = getPrefix(false, 'images', source, category, subCategory, collection, name);
    const photos = await storage.listFolder({ Bucket: bucketName, Delimiter: '/', Prefix: photoPrefix });

    const videoPrefix = getPrefix(false, 'videos', source, category, subCategory, collection, name);
    const videos = await storage.listFolder({ Bucket: bucketName, Delimiter: '/', Prefix: videoPrefix });

    const albumWithMedia = {
        ...album,
        signedUrl: signFile(coverPrefix + toSlug(album.name) + '.jpg', signerPrivateKey),
        photoList: photos.filter((item) => item !== '').map((item) => {
            return {
                name: item,
                signedPhotoUrl: signFile(process.env['MEDIA_HOST'] + '/' + photoPrefix + item, signerPrivateKey)
            }
        }),
        videoList: videos.filter((item) => item !== '').map((item) => {
            return {
                name: item,
                signedVideoUrl: signFile(process.env['MEDIA_HOST'] + '/' + videoPrefix + item, signerPrivateKey)
            }
        })
    };

    return response.createResponse(albumWithMedia, 200);
};

const getPrefix = (isHost = true, type = 'images', source, category, subCategory, collection, name) => {
    return (
        (isHost ? process.env['MEDIA_HOST'] + '/' : '') + 'protected/' + type + '/' + source + '/'
        + (category ? category.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
        + (subCategory ? subCategory.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
        + (collection ? collection.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
        + (name ? name.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
    );
}

const getSignerPrivateKey = async () => {
    return await secret.getSecretValue({SecretId: process.env['SIGNER_PRIVATE_KEY']});
}

// Signs one exact URL (CloudFront custom policy whose Resource is the URL itself, no wildcard),
// so the signature cannot be reused on any other file.
const signFile = (url, signerPrivateKey, minutesToExpire = SIGNED_URL_EXPIRY_MINUTES) => {
    const signatureParams = distribution.getSignatureParameters(
        process.env['CLOUDFRONT_PUBLIC_KEY_ID'],
        signerPrivateKey,
        false,
        url,
        minutesToExpire
    );
    return distribution.getSignedUrlWithParameters({...signatureParams, url: url});
}

const toSlug = (value) => value.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase();