'use strict';
import * as array from '@taleofddh/array';
import { getCaller, loadRolePermissionsFromTable, requirePermission } from '@taleofddh/auth';
import * as database from '@taleofddh/database';
import * as distribution from '@taleofddh/distribution';
import * as date from '@taleofddh/date';
import * as response from '@taleofddh/response';
import * as secret from '@taleofddh/secret';
import * as storage from '@taleofddh/storage';
import { v6 as uuidv6 } from 'uuid';
import { latestModified, toPublicAlbum, toPublicLevelMeta, validateAlbumMeta, validateLevelMeta, validateLevelPath, LEVELS } from './seo-text.js';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucketName = process.env['S3_MEDIA_BUCKET'];
const source = "gallery";
const SIGNED_URL_EXPIRY_MINUTES = 30;

export const createOrUpdateAlbum = async (event) => {
    let caller;
    try {
        caller = await requirePermission(event, 'gallery:createOrUpdateAlbum');
    } catch (error) {
        return response.createErrorResponse(error.message, error.statusCode || 500);
    }
    const data = parseBody(event);
    const { errors, value: meta } = validateAlbumMeta(data);
    if (!data || typeof data !== 'object' || errors.length > 0) {
        return response.createValidationErrorResponse('Invalid request', { errors: errors.length > 0 ? errors : ['Request body must be a JSON object'] });
    }
    const userId = caller.sub;

    let album;
    const existingAlbum = (!userId || false) ? {} : await getAlbum(data.name, data.startDateTime);
    const videoCount = await countVideos(data);
    if(!existingAlbum) {
        album = await createAlbum(data, userId, meta, videoCount);
    } else {
        album = await updateAlbum(data, userId, meta, videoCount);
    }

    await triggerRebuild();
    return response.createResponse(album, 200);
}

const parseBody = (event) => {
    try {
        return JSON.parse(event.body || '');
    } catch (error) {
        return null;
    }
}

// Videos are counted from the protected media folder at save time, so the public lists can show videoCount
// without listing storage on every request. Returns undefined when the count can't be read (the stored value is kept).
const countVideos = async (data) => {
    try {
        const prefix = getPrefix(false, 'videos', source, data.category, data.subCategory, data.collection, data.name);
        const videos = await storage.listFolder({ Bucket: bucketName, Delimiter: '/', Prefix: prefix });
        return videos.filter((item) => item !== '').length;
    } catch (error) {
        console.error('Video count failed', error.name);
        return undefined;
    }
}

// Starts the Amplify rebuild so the static gallery pages pick up the change. One secret holds a webhook URL
// per stage: {"dev": "https://...", "prod": "https://..."}. The URL is never logged; a failed call doesn't fail the save.
const triggerRebuild = async () => {
    try {
        const urls = JSON.parse(await secret.getSecretValue({ SecretId: process.env['AMPLIFY_WEBHOOK_URL'] }) || '');
        const url = String(urls[process.env['ENVIRONMENT']] || '').trim();
        if (!url.startsWith('https://')) {
            throw new Error('No https webhook URL for this stage');
        }
        const result = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(5000) });
        if (!result.ok) {
            throw new Error(`Webhook returned ${result.status}`);
        }
    } catch (error) {
        console.error('Amplify rebuild trigger failed', error.name);
    }
}

export const findAlbum = async (event) => {
    const name = decodeURI(event.pathParameters.name);
    const startDateTime = decodeURI(event.pathParameters.startDateTime);
    let caller;
    try {
        caller = await requirePermission(event, 'gallery:findAlbum');
    } catch (error) {
        return response.createErrorResponse(error.message, error.statusCode || 500);
    }
    const userId = caller.sub;

    const album = (!userId || false) ? {} : await getAlbum(name, startDateTime);

    return response.createResponse(album, 200);
}

export const findAlbums = async (event) => {
    try {
        await requirePermission(event, 'gallery:findAlbums');
    } catch (error) {
        return response.createErrorResponse(error.message, error.statusCode || 500);
    }
    const params = {
        TableName: table,
        ProjectionExpression: "id, category, subCategory, #collection, #name, startDateTime, endDateTime, description, titlePhoto, albumLocation, #searchName, photoCount, viewCount, production, summary, coverAlt, locationLabel, videoCount, updatedDateTime",
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

const createAlbum = async (data, userId, meta = {}, videoCount) => {
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
            "description": meta.description !== undefined ? meta.description : data.description,
            "photoCount": parseInt(data.photoCount),
            "viewCount": parseInt(data.viewCount),
            "titlePhoto": data.titlePhoto,
            "restrictedFlag": data.restrictedFlag,
            "defaultFlag": data.defaultFlag,
            "searchName": data.name.toUpperCase(),
            "createDate": new Date().toDateString(),
            "updateDate": new Date().toDateString(),
            "updatedDateTime": new Date().toISOString()
        }
    }
    for (const field of ['summary', 'coverAlt', 'locationLabel']) {
        if (meta[field] !== undefined) params.Item[field] = meta[field];
    }
    if (videoCount !== undefined) params.Item.videoCount = videoCount;
    const res = (!userId || false) ? {} : await database.put(params);

    return await getAlbum(data.name, data.startDateTime);
}

const updateAlbum = async(data, userId, meta = {}, videoCount) => {
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
                "#viewCount = :viewCount, " +
                "#updateDate = :updateDate",
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
            ":description": meta.description !== undefined ? meta.description : data.description,
            ":photoCount": parseInt(data.photoCount),
            ":viewCount": parseInt(data.viewCount),
            ":updateDate": new Date().toDateString()
        },
        ReturnValues: "ALL_NEW"
    }
    // New text fields are only written when the request carries them, so older clients don't blank them.
    const extra = { ...meta, updatedDateTime: new Date().toISOString() };
    delete extra.description;
    if (videoCount !== undefined) extra.videoCount = videoCount;
    for (const [field, value] of Object.entries(extra)) {
        params.UpdateExpression += `, #${field} = :${field}`;
        params.ExpressionAttributeNames[`#${field}`] = field;
        params.ExpressionAttributeValues[`:${field}`] = value;
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
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime, photoCount, viewCount, description, summary, coverAlt, locationLabel, videoCount, updatedDateTime",
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

    const albumList = albums.map((album) => {
        const prefix = getPublicPrefix(album.category, album.subCategory, album.collection);
        return toPublicAlbum(album, prefix + toSlug(album.name) + '.jpg');
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
    const prefix = getPublicPrefix();
    const albumCategoryList = albumCategories.map((category) => {
        return {
            name: category,
            signedUrl: prefix + toSlug(category) + '.jpg'
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
    const prefix = getPublicPrefix(category);
    const albumSubCategoryList = albumSubCategories.map((subCategory) => {
        return {
            name: subCategory,
            signedUrl: prefix + toSlug(subCategory) + '.jpg'
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
    const prefix = getPublicPrefix(category, subCategory);
    const albumCollectionList = albumCollections.map((collection) => {
        return {
            name: collection,
            signedUrl: prefix + toSlug(collection) + '.jpg'
        }
    });

    return response.createResponse(albumCollectionList, 200);
};

export const findAlbumCategorySubCategoryCollections = async (event) => {
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime, updatedDateTime",
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
            return {category: item, subCategory: item1, collections: array.distinctValues(subCategorizedCollections, "collection"), updatedDateTime: latestModified(subCategorizedCollections)};
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
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime, photoCount, viewCount, description, summary, coverAlt, locationLabel, videoCount, updatedDateTime",
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

    const prefix = getPublicPrefix(category, subCategory, collection);
    const albumList = albums.map((album) => {
        return toPublicAlbum(album, prefix + toSlug(album.name) + '.jpg');
    });

    return response.createResponse(albumList, 200);
};

export const findAlbumCategorySubCategoryCollectionNames = async (event) => {
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, subCategory, #collection, #name, startDateTime, endDateTime, updatedDateTime",
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
                const names = array.distinctValues(collectionNames, "name");
                return {
                    category: item, subCategory: item1, collection: item2, names,
                    // Per-name last modified, in the same order as names, for sitemap lastmod.
                    updatedDateTimes: names.map((name) => latestModified(collectionNames.filter((album) => album.name === name))),
                    updatedDateTime: latestModified(collectionNames)
                };
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
        ProjectionExpression: "id, category, subCategory, #collection, #name, startDateTime, endDateTime, description, titlePhoto, albumLocation, #searchName, photoCount, viewCount, production, summary, coverAlt, locationLabel, videoCount, updatedDateTime",
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


    const photoPrefix = getPrefix(false, 'images', source, category, subCategory, collection, name);
    const photos = await storage.listFolder({ Bucket: bucketName, Delimiter: '/', Prefix: photoPrefix });

    const videoPrefix = getPrefix(false, 'videos', source, category, subCategory, collection, name);
    const videos = await storage.listFolder({ Bucket: bucketName, Delimiter: '/', Prefix: videoPrefix });

    const albumWithMedia = {
        ...album,
        signedUrl: getPublicPrefix(category, subCategory, collection) + toSlug(album.name) + '.jpg',
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

// Browse-page covers (gallery, category, sub-category, collection) are public: plain CloudFront URLs
// under /public/images/gallery/..., no signing. The field is still named signedUrl because the shared
// UI list-module reads it. Only findAlbumWithMedia signs, for the album's own cover, photos and videos.
const getPublicPrefix = (category, subCategory, collection) => {
    return process.env['MEDIA_HOST'] + '/public/images/' + source + '/'
        + (category ? toSlug(category) + '/' : '')
        + (subCategory ? toSlug(subCategory) + '/' : '')
        + (collection ? toSlug(collection) + '/' : '');
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
// ---- Gallery level text (category, sub-category, collection) ----
// Stored in the galleryLevelMeta table: key = level + path (slugs joined by "/", like the UI routes).
// The cover image is the existing public browse cover at gallery/<path>.jpg.
const levelCoverUrl = (path) => process.env['MEDIA_HOST'] + '/public/images/' + source + '/' + path + '.jpg';

export const createOrUpdateAlbumLevelMeta = async (event) => {
    let caller;
    try {
        caller = await requirePermission(event, 'gallery:createOrUpdateLevelMeta');
    } catch (error) {
        return response.createErrorResponse(error.message, error.statusCode || 500);
    }
    const { errors, value } = validateLevelMeta(parseBody(event));
    if (errors.length > 0) {
        return response.createValidationErrorResponse('Invalid request', { errors });
    }
    await database.put({
        TableName: table,
        Item: { ...value, updatedDateTime: new Date().toISOString(), updatedBy: caller.sub }
    });
    const item = await database.get({ TableName: table, Key: { level: value.level, path: value.path } });
    await triggerRebuild();
    return response.createResponse(toPublicLevelMeta(item, levelCoverUrl(value.path)), 200);
}

export const findAlbumLevelMeta = async (event) => {
    const level = decodeURIComponent(event.pathParameters?.level || '');
    const path = decodeURIComponent(event.pathParameters?.path || '');
    if (!LEVELS.includes(level) || validateLevelPath(level, path).length > 0) {
        return response.createNotFoundResponse('Gallery level', path);
    }
    const item = await database.get({ TableName: table, Key: { level, path } });
    if (!item) {
        return response.createNotFoundResponse('Gallery level', path);
    }
    return response.createResponse(toPublicLevelMeta(item, levelCoverUrl(path)), 200);
}

export const findAlbumLevelMetaList = async (event) => {
    const items = await database.scan({ TableName: table });
    const list = (items || [])
        .map((item) => toPublicLevelMeta(item, levelCoverUrl(item.path)))
        .sort((a, b) => (a.level + '/' + a.path).localeCompare(b.level + '/' + b.path));
    return response.createResponse(list, 200);
}

/**
 * Permissions the signed-in user holds in this service, from this service's rolePermissions table.
 * Display-only, for the UI; every endpoint still enforces its permission with requirePermission.
 * A "*" row is returned as "gallery:*" so it can't be read as access to other services.
 */
export const findPermissions = async (event) => {
    let caller;
    let rolePermissions;
    try {
        caller = getCaller(event);
        rolePermissions = await loadRolePermissionsFromTable();
    } catch (error) {
        if (error.statusCode === 401) {
            return response.createErrorResponse(error.message, 401);
        }
        console.error('findPermissions failed', error);
        return response.createErrorResponse('Role permissions are unavailable', 500);
    }
    const permissions = new Set();
    for (const group of caller.groups) {
        for (const permission of rolePermissions.get(group) || []) {
            permissions.add(permission === '*' ? 'gallery:*' : permission);
        }
    }
    return response.createResponse({ permissions: [...permissions].sort() }, 200);
}
