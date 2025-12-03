'use strict';
import * as array from '@taleofddh/array';
import * as database from '@taleofddh/database';
import * as date from '@taleofddh/date';
import * as distribution from '@taleofddh/distribution';
import * as response from '@taleofddh/response';
import * as secret from '@taleofddh/secret';
import * as storage from '@taleofddh/storage';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucket = process.env['S3_BUCKET'];
const source = "blogs";

export const findCategorizedBlogList = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const homePageFlag = decodeURI(event.pathParameters.category) === 'true';
    const params = {
        TableName: table,
        FilterExpression: homePageFlag ? '#category = :category and #homePageFlag = :homePageFlag' : '#category = :category',
        ExpressionAttributeNames: homePageFlag ? {
            '#category': 'category',
            '#homePageFlag': 'homePageFlag'
        } : {
            '#category': 'category'
        },
        ExpressionAttributeValues: homePageFlag ? {':category': category, ':homePageFlag': homePageFlag} : {':category': category}
    };
    const blogList = await database.scan(params);
    blogList.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0) || a.date - b.date);
    return response.createResponse(blogList, 200);
};

export const updateBlogViewCount = async (event) => {
    const data = JSON.parse(event.body);
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
    const updatedBlog = await database.update(params);
    return response.createResponse(updatedBlog, 200);
};

export const findBlogCommentList = async (event) => {
    const blogName = decodeURI(event.pathParameters.blogName);
    const params = {
        TableName: table,
        KeyConditionExpression: '#blogName = :blogName',
        ExpressionAttributeNames: {
            '#blogName': 'blogName',
        },
        ExpressionAttributeValues: {':blogName': blogName},
        ScanIndexForward: false
    };
    const blogCommentList = await database.query(params);
    return response.createResponse(blogCommentList, 200);
};

export const addBlogComment = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        Item: {
            "blogName": data.blogName,
            "name": data.name,
            "comment": data.comment,
            "date": data.date
        }
    }
    const blogComment = await database.put(params);
    return response.createResponse(blogComment, 200);
};

export const getBlogDocument = async (event) => {
    const prefix = decodeURI(event.pathParameters.prefix);
    const file = decodeURI(event.pathParameters.file);
    let object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + file});
    return {
        statusCode: 200,
        body: JSON.stringify(await object.Body.transformToString('utf-8')),
        headers: {
            "isBase64Encoded": true,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": object.ContentType
        }
    };
}

export const findHistoricalBlogCategories = async (event) => {
    const historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "#name, category, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#startDateTime': 'startDateTime'
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate)
        },
    };
    const blogs = await database.scan(params);
    blogs.sort((a,b) => (a.category.localeCompare(b.category)));

    const blogCategories = array.distinctValues(blogs, "category");
    const prefix = getPrefix(true, 'images', source);
    const signatureParams = await getSignatureParameters(prefix, 30);
    const albumCategoryList = blogCategories.map((category) => {
        return {
            name: category,
            signedUrl: distribution.getSignedUrlWithPolicy(
                    {...signatureParams, url: prefix + category.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
            )
        }
    });

    return response.createResponse(albumCategoryList, 200);
};

export const findBlogCategories = async (event) => {
    let historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, #name, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#startDateTime': "startDateTime"
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate),
            ':production': true
        }
    };
    const blogs = await database.scan(params);

    let categories = array.distinctValues(blogs, "category");

    return response.createResponse(blogs, 200);
}

export const findHistoricalBlogNames = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, #name, startDateTime, endDateTime, header, title, author, titlePhoto, viewCount",
        FilterExpression: '#category = :category and #startDateTime < :historicalDate',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#category': 'category',
            '#startDateTime': "startDateTime"
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate)
        }
    };
    const blogs = await database.scan(params);
    blogs.sort((a,b) => (a.name.localeCompare(b.name)));

    const prefix = getPrefix(true, 'images', source, category);
    const signatureParams = await getSignatureParameters(prefix, 1440);
    const blogList = blogs.map((blog) => {
        return {
            ...blog,
            signedUrl: distribution.getSignedUrlWithPolicy(
                    {...signatureParams, url: prefix + blog.titlePhoto.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
            )
        }
    });

    return response.createResponse(blogList, 200);
};

export const findBlogCategoryNames = async (event) => {
    let historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, #name, startDateTime, endDateTime",
        FilterExpression: '#startDateTime < :historicalDate',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#startDateTime': "startDateTime"
        },
        ExpressionAttributeValues: {
            ':historicalDate': date.dateTimeFullFormatToString(historicalDate)
        }
    };
    const blogs = await database.scan(params);

    let categoryNames = array.distinctValues(blogs, "category").map((item) => {
        let categorizedBlogs = blogs.filter((item1) => {
            return item1.category === item;
        });
        return {category: item, names: array.distinctValues(categorizedBlogs, "name")};
    })

    return response.createResponse(categoryNames, 200);
}

export const findBlog = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const name = decodeURI(event.pathParameters.name);
    let currentDate = new Date();
    const params = {
        TableName: table,
        ProjectionExpression: "id, category, #name, startDateTime, endDateTime, header, title, titlePhoto, author, #searchName, viewCount, content, images",
        FilterExpression: '#searchName = :searchName and #category = :category and #startDateTime < :currentDate',
        ExpressionAttributeNames: {
            "#name": 'name',
            '#category': 'category',
            '#startDateTime': "startDateTime",
            '#searchName': 'searchName'
        },
        ExpressionAttributeValues: {
            ':searchName': name.toUpperCase(),
            ':category': category,
            ':currentDate': date.dateTimeFullFormatToString(currentDate)
        }
    };
    const blogs = await database.scan(params);

    const prefix = getPrefix(true, 'images', source, category);
    const signatureParams = await getSignatureParameters(prefix, 1440);
    const blogList = blogs.map((blog) => {
        return {
            ...blog,
            signedUrl: distribution.getSignedUrlWithPolicy(
                    {...signatureParams, url: prefix + blog.name.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '.jpg'}
            )
        }
    });

    return response.createResponse(blogList[0], 200);
};

const getPrefix = (isHost = true, type = 'images', source, category, name) => {
    return (
            (isHost ? process.env['MEDIA_PROTECTED_HOST'] + '/' : '') + 'protected/' + type + '/' + source + '/'
            + (category ? category.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase() + '/' : '')
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