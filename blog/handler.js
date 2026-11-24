'use strict';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as array from '@taleofddh/array';
import { getCaller, loadRolePermissionsFromTable, requirePermission } from '@taleofddh/auth';
import * as database from '@taleofddh/database';
import * as date from '@taleofddh/date';
import { parseDenyList, privacyErrors } from '@taleofddh/privacy';
import * as response from '@taleofddh/response';
import * as secret from '@taleofddh/secret';
import * as storage from '@taleofddh/storage';
import { v6 as uuidv6 } from 'uuid';
import { latestModified, validateBlogMeta, withBlogMeta } from './seo-text.js';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucket = process.env['S3_BUCKET'];
const source = "blogs";
// Blog images are public: plain CloudFront URLs under /public/images/blogs/..., no signing.
// The field is still named signedUrl because the shared UI list-module reads it.

// ---- Privacy scan for public blog text ----
// Shared by createOrUpdateBlog (rejects) and the blog text worker (masks).
// Names that must never appear in public text (family names). One Secrets Manager secret holds a list per stage:
// {"dev": [...], "prod": [...]} (same pattern as the Amplify webhook secret), read through @taleofddh/secret.
// CONTENT_DENY_LIST is shared with the gallery service.
const createDenyListReader = (getValue, stage, { ttlMs = 5 * 60 * 1000, now = Date.now, onError = () => {} } = {}) => {
    let cached;
    let readAt = 0;
    return async () => {
        if (cached && now() - readAt < ttlMs) return cached;
        try {
            const value = await getValue();
            if (value === null || value === undefined) throw new Error('Deny list unavailable');
            cached = parseDenyList(value, stage);
            readAt = now();
        } catch (error) {
            onError(error);
            return cached || [];
        }
    };
};
const readDenyList = createDenyListReader(
    () => secret.getSecretValue({ SecretId: process.env['CONTENT_DENY_LIST'] }),
    process.env['ENVIRONMENT'],
    { onError: () => console.error('Deny list unavailable, pattern checks only') }
);

export const findCategorizedBlogList = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const homePageFlag = decodeURI(event.pathParameters.category) === 'true';
    // Only published blogs (production = true) or blogs without the flag (pre-existing records).
    const productionFilter = '(attribute_not_exists(#production) OR #production = :production)';
    const params = {
        TableName: table,
        FilterExpression: homePageFlag
            ? `#category = :category and #homePageFlag = :homePageFlag and ${productionFilter}`
            : `#category = :category and ${productionFilter}`,
        ExpressionAttributeNames: {
            '#category': 'category',
            '#production': 'production',
            ...(homePageFlag ? { '#homePageFlag': 'homePageFlag' } : {})
        },
        ExpressionAttributeValues: {
            ':category': category,
            ':production': true,
            ...(homePageFlag ? { ':homePageFlag': homePageFlag } : {})
        }
    };
    const blogList = await database.scan(params);
    blogList.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0) || a.date - b.date);
    return response.createResponse(blogList.map(withBlogMeta), 200);
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
    const prefix = getPrefix(source);
    const albumCategoryList = blogCategories.map((category) => {
        return {
            name: category,
            signedUrl: prefix + toSlug(category) + '.jpg'
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
        ProjectionExpression: "category, #name, startDateTime, endDateTime, header, title, author, titlePhoto, viewCount, summary, titlePhotoAlt, updatedDateTime",
        FilterExpression: '#category = :category and #startDateTime < :historicalDate and (attribute_not_exists(#production) OR #production = :production)',
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
    const blogs = await database.scan(params);
    blogs.sort((a,b) => (a.name.localeCompare(b.name)));

    const prefix = getPrefix();
    const blogList = blogs.map((blog) => {
        return {
            ...withBlogMeta(blog),
            signedUrl: prefix + getImagePath(category, blog.titlePhoto)
        }
    });

    return response.createResponse(blogList, 200);
};

export const findBlogCategoryNames = async (event) => {
    let historicalDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const params = {
        TableName: table,
        IndexName: "category-index",
        ProjectionExpression: "category, #name, startDateTime, endDateTime, updatedDateTime",
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
        const names = array.distinctValues(categorizedBlogs, "name");
        return {
            category: item, names,
            // Per-name last modified, in the same order as names, for sitemap lastmod.
            updatedDateTimes: names.map((name) => latestModified(categorizedBlogs.filter((blog) => blog.name === name))),
            updatedDateTime: latestModified(categorizedBlogs)
        };
    })

    return response.createResponse(categoryNames, 200);
}

export const findBlog = async (event) => {
    const category = decodeURI(event.pathParameters.category);
    const name = decodeURI(event.pathParameters.name);
    let currentDate = new Date();
    const params = {
        TableName: table,
        ProjectionExpression: "id, category, #name, startDateTime, endDateTime, header, title, titlePhoto, author, #searchName, viewCount, content, images, summary, titlePhotoAlt, updatedDateTime",
        FilterExpression: '#searchName = :searchName and #category = :category and #startDateTime < :currentDate and (attribute_not_exists(#production) OR #production = :production)',
        ExpressionAttributeNames: {
            "#name": 'name',
            '#category': 'category',
            '#startDateTime': "startDateTime",
            '#searchName': 'searchName',
            '#production': 'production'
        },
        ExpressionAttributeValues: {
            ':searchName': name.toUpperCase(),
            ':category': category,
            ':currentDate': date.dateTimeFullFormatToString(currentDate),
            ':production': true
        }
    };
    const blogs = await database.scan(params);

    const prefix = getPrefix();
    const blogList = blogs.map((blog) => {
        return {
            ...withBlogMeta(blog),
            signedUrl: prefix + getImagePath(category, blog.titlePhoto)
        }
    });

    return response.createResponse(blogList[0], 200);
};

// e.g. https://media.taleofddh.com/public/images/ or .../public/images/blogs/
const getPrefix = (folder) => {
    return process.env['MEDIA_HOST'] + '/public/images/' + (folder ? folder + '/' : '');
}

const toSlug = (value) => value.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase();

// Every blog image lives at blogs/<category>/<slug>/<file>.jpg. Recipe and Technical titlePhoto values
// already start with that; Travel ones (e.g. vacation/africa/...) get blogs/<category>/ added.
const getImagePath = (category, titlePhoto) => {
    return titlePhoto.startsWith('blogs/') ? titlePhoto : 'blogs/' + toSlug(category) + '/' + titlePhoto;
}

// ---- Blog management (blog-manager and admin only) ----
const mediaBucket = process.env['S3_MEDIA_BUCKET'];
// Validation and key building. S3 keys are built only from a validated category and name; nothing path-like from the request is used.
const CATEGORIES = ['Travel', 'Recipe', 'Technical'];
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 80;
const MAX_MARKDOWN_BYTES = 200 * 1024;
const MAX_TITLE_PHOTO_BYTES = 2 * 1024 * 1024;
const TITLE_PHOTO_CONTENT_TYPE = 'image/jpeg';
const TITLE_PHOTO_URL_EXPIRY_SECONDS = 300;
const MAX_TEXT_LENGTH = 500;
const MAX_HEADER_LENGTH = 2000;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const MODES = ['create', 'update'];

const isString = (value) => typeof value === 'string';
const isBlank = (value) => !isString(value) || value.trim().length === 0;
const isIsoDate = (value) => isString(value) && ISO_PATTERN.test(value) && !Number.isNaN(Date.parse(value));

const validateCategory = (category, errors = []) => {
    if (!CATEGORIES.includes(category)) {
        errors.push(`category must be one of ${CATEGORIES.join(', ')}`);
    }
    return errors;
};

const validateName = (name, errors = []) => {
    if (!isString(name) || name.length > MAX_NAME_LENGTH || !NAME_PATTERN.test(name)) {
        errors.push(`name must be lower case letters, digits and single hyphens, at most ${MAX_NAME_LENGTH} characters`);
    }
    return errors;
};

/**
 * Validate the createOrUpdateBlog body. Returns { errors: string[], value }.
 * `value` holds only the fields the handler may write, trimmed.
 */
const isPublished = (v) => v === true;

const validateBlogInput = (data) => {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { errors: ['Request body must be a JSON object'] };
    }
    if (!MODES.includes(data.mode)) {
        errors.push(`mode must be one of ${MODES.join(', ')}`);
    }
    for (const field of ['name', 'title', 'category', 'author', 'startDateTime', 'content']) {
        if (isBlank(data[field])) {
            errors.push(`${field} is required`);
        }
    }
    if (!isBlank(data.category)) validateCategory(data.category, errors);
    if (!isBlank(data.name)) validateName(data.name, errors);
    for (const [field, max] of [['title', MAX_TEXT_LENGTH], ['author', MAX_TEXT_LENGTH], ['header', MAX_HEADER_LENGTH]]) {
        if (data[field] !== undefined && data[field] !== null && (!isString(data[field]) || data[field].length > max)) {
            errors.push(`${field} must be text of at most ${max} characters`);
        }
    }
    const meta = validateBlogMeta(data);
    errors.push(...meta.errors);
    if (isString(data.content) && Buffer.byteLength(data.content, 'utf8') > MAX_MARKDOWN_BYTES) {
        errors.push(`content must be at most ${MAX_MARKDOWN_BYTES / 1024} KB`);
    }
    const hasEnd = data.endDateTime !== undefined && data.endDateTime !== null && data.endDateTime !== '';
    if (!isBlank(data.startDateTime) && !isIsoDate(data.startDateTime)) {
        errors.push('startDateTime must be a valid ISO date-time string');
    }
    if (hasEnd && !isIsoDate(data.endDateTime)) {
        errors.push('endDateTime must be a valid ISO date-time string');
    }
    if (hasEnd && isIsoDate(data.startDateTime) && isIsoDate(data.endDateTime)
        && Date.parse(data.endDateTime) < Date.parse(data.startDateTime)) {
        errors.push('endDateTime must not be before startDateTime');
    }
    if (errors.length > 0) {
        return { errors };
    }
    return {
        errors,
        value: {
            mode: data.mode,
            name: data.name,
            category: data.category,
            title: data.title.trim(),
            header: isString(data.header) ? data.header : '',
            author: data.author.trim(),
            startDateTime: data.startDateTime,
            endDateTime: hasEnd ? data.endDateTime : data.startDateTime,
            content: data.content,
            production: data.production === true,
            // Only present when the request carried them; absent means "leave the stored value alone" on update.
            ...meta.value
        }
    };
};

/** Validate the presigned URL body. Returns { errors, value }. */
const validateTitlePhotoInput = (data) => {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { errors: ['Request body must be a JSON object'] };
    }
    validateCategory(data.category, errors);
    validateName(data.name, errors);
    if (!Number.isInteger(data.size) || data.size <= 0 || data.size > MAX_TITLE_PHOTO_BYTES) {
        errors.push(`size must be a whole number of bytes between 1 and ${MAX_TITLE_PHOTO_BYTES}`);
    }
    return errors.length > 0 ? { errors } : { errors, value: { category: data.category, name: data.name, size: data.size } };
};

const markdownKey = (category, name) => `${category}/${name}.md`;
const titlePhoto = (category, name) => `blogs/${category.toLowerCase()}/${name}/${name}.jpg`;
const titlePhotoUploadKey = (category, name) => `public/images/${titlePhoto(category, name)}`;
let s3Client;
const getS3Client = () => s3Client || (s3Client = new S3Client({ region: process.env['REGION'] || 'eu-west-1' }));
// Every management handler starts here. The Cognito authorizer has verified the token; the permission comes
// from the blog rolePermissions table (blog-manager gets the blog:* actions below, admin gets "*").
const authorize = async (event, permission) => {
    try {
        return { caller: await requirePermission(event, permission) };
    } catch (error) {
        if (!error.statusCode) {
            console.error(`${permission} authorization failed`, error.name);
        }
        return { failure: response.createErrorResponse(error.message, error.statusCode || 500) };
    }
};
const parseBody = (event) => {
    try {
        return JSON.parse(event.body || '');
    } catch (error) {
        return null;
    }
};
const badRequest = (errors) => response.createValidationErrorResponse('Invalid request', { errors });
// Blog items are keyed by name + startDateTime, so look up by name and match the category.
const findBlogRecord = async (category, name) => {
    const items = await database.query({
        TableName: table,
        KeyConditionExpression: '#name = :name',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': name }
    });
    return (items || []).find((item) => item.category === category);
};
// Starts the Amplify rebuild. One secret holds a webhook URL per stage: {"dev": "https://...", "prod": "https://..."}.
// The URL is a secret: it is never logged and never returned.
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
        return true;
    } catch (error) {
        // Name only: fetch errors can embed the URL.
        console.error('Amplify rebuild trigger failed', error.name);
        return false;
    }
};
export const createOrUpdateBlog = async (event) => {
    const { caller, failure } = await authorize(event, 'blog:createOrUpdateBlog');
    if (failure) return failure;
    const { errors, value } = validateBlogInput(parseBody(event));
    // The same private-detail rules as the worker's scan: emails, phone numbers, postcodes, booking references, deny list names.
    errors.push(...privacyErrors({ content: value.content, summary: value.summary, titlePhotoAlt: value.titlePhotoAlt }, await readDenyList()));
    if (errors.length > 0) {
        return badRequest(errors);
    }
    const existing = await findBlogRecord(value.category, value.name);
    if (value.mode === 'create' && existing) {
        return response.createConflictResponse(`Blog ${value.category}/${value.name} already exists`);
    }
    if (value.mode === 'update' && !existing) {
        return response.createNotFoundResponse('Blog', `${value.category}/${value.name}`);
    }
    if (existing && existing.startDateTime !== value.startDateTime) {
        // startDateTime is part of the table key, so it can't change on update.
        return badRequest(['startDateTime cannot be changed on an existing blog']);
    }
    const now = date.dateTimeFullFormatToString(new Date());
    const updatedDateTime = new Date().toISOString();
    const content = markdownKey(value.category, value.name);
    await storage.putObject({
        Bucket: bucket,
        Key: content,
        Body: value.content,
        ContentType: 'text/markdown; charset=utf-8'
    });
    const common = {
        header: value.header,
        title: value.title,
        author: value.author,
        endDateTime: value.endDateTime,
        titlePhoto: titlePhoto(value.category, value.name),
        content
    };
    // summary and titlePhotoAlt are only written when the request carries them, so older clients don't blank them.
    const seoUpdate = { expression: '', names: {}, values: {} };
    for (const field of ['summary', 'titlePhotoAlt']) {
        if (value[field] !== undefined) {
            seoUpdate.expression += `, #${field} = :${field}`;
            seoUpdate.names[`#${field}`] = field;
            seoUpdate.values[`:${field}`] = value[field];
        }
    }
    let blog;
    try {
    if (!existing) {
        blog = {
            id: uuidv6({ msecs: new Date(value.startDateTime).getTime() }),
            category: value.category,
            name: value.name,
            searchName: value.name.toUpperCase(),
            startDateTime: value.startDateTime,
            ...common,
            summary: value.summary || '',
            titlePhotoAlt: value.titlePhotoAlt || '',
            production: value.production,
            updatedDateTime: updatedDateTime,
            viewCount: 0,
            createdBy: caller.sub,
            createdAt: now
        };
        await database.put({
            TableName: table,
            Item: blog,
            ConditionExpression: 'attribute_not_exists(#name)',
            ExpressionAttributeNames: { '#name': 'name' }
        });
    } else {
        blog = await database.update({
            TableName: table,
            Key: { name: value.name, startDateTime: existing.startDateTime },
            ConditionExpression: 'attribute_exists(#name)',
            UpdateExpression: 'SET #header = :header, #title = :title, #author = :author, #endDateTime = :endDateTime, ' +
                '#titlePhoto = :titlePhoto, #content = :content, #updatedBy = :updatedBy, #updatedAt = :updatedAt, #updatedDateTime = :updatedDateTime, ' +
                '#production = :production' +
                seoUpdate.expression,
            ExpressionAttributeNames: {
                '#name': 'name', '#header': 'header', '#title': 'title', '#author': 'author',
                '#endDateTime': 'endDateTime', '#titlePhoto': 'titlePhoto', '#content': 'content',
                '#updatedBy': 'updatedBy', '#updatedAt': 'updatedAt', '#updatedDateTime': 'updatedDateTime',
                '#production': 'production',
                ...seoUpdate.names
            },
            ExpressionAttributeValues: {
                ':header': common.header, ':title': common.title, ':author': common.author,
                ':endDateTime': common.endDateTime, ':titlePhoto': common.titlePhoto, ':content': common.content,
                ':updatedBy': caller.sub, ':updatedAt': now, ':updatedDateTime': updatedDateTime,
                ':production': value.production,
                ...seoUpdate.values
            },
            ReturnValues: 'ALL_NEW'
        });
    }
    } catch (error) {
        // Lost a race with another create, or the record vanished between the lookup and the write.
        if (error.name === 'ConditionalCheckFailedException') {
            return existing
                ? response.createNotFoundResponse('Blog', `${value.category}/${value.name}`)
                : response.createConflictResponse(`Blog ${value.category}/${value.name} already exists`);
        }
        throw error;
    }
    // Trigger a rebuild only when the blog is published now or was published before this save.
    // Saving an unpublished blog (e.g. to generate its text) runs no build.
    const rebuildTriggered = (isPublished(value.production) || isPublished(existing?.production))
        ? await triggerRebuild()
        : false;
    return response.createResponse({ blog, rebuildTriggered }, 200);
};
export const blogForEdit = async (event) => {
    const { failure } = await authorize(event, 'blog:blogForEdit');
    if (failure) return failure;
    const category = decodeURIComponent(event.pathParameters?.category || '');
    const name = decodeURIComponent(event.pathParameters?.name || '');
    const errors = validateName(name, validateCategory(category));
    if (errors.length > 0) {
        return badRequest(errors);
    }
    const blog = await findBlogRecord(category, name);
    if (!blog) {
        return response.createNotFoundResponse('Blog', `${category}/${name}`);
    }
    // Read the key built from the validated category and name, not the stored field.
    const object = await storage.getObject({ Bucket: bucket, Key: markdownKey(category, name) });
    if (!object) {
        return response.createNotFoundResponse('Blog document', `${category}/${name}`);
    }
    return response.createResponse({ blog, markdown: await object.Body.transformToString('utf-8') }, 200);
};
// A presigned PUT can't cap the upload size by itself, so the exact size is signed as Content-Length:
// S3 rejects an upload whose body, type or key differs from what was signed.
export const blogTitlePhotoUploadUrl = async (event) => {
    const { failure } = await authorize(event, 'blog:blogTitlePhotoUploadUrl');
    if (failure) return failure;
    const { errors, value } = validateTitlePhotoInput(parseBody(event));
    if (errors.length > 0) {
        return badRequest(errors);
    }
    const key = titlePhotoUploadKey(value.category, value.name);
    const url = await getSignedUrl(
        getS3Client(),
        new PutObjectCommand({
            Bucket: mediaBucket,
            Key: key,
            ContentType: TITLE_PHOTO_CONTENT_TYPE,
            ContentLength: value.size
        }),
        {
            expiresIn: TITLE_PHOTO_URL_EXPIRY_SECONDS,
            signableHeaders: new Set(['content-type', 'content-length'])
        }
    );
    return response.createResponse({
        url,
        method: 'PUT',
        key,
        headers: { 'Content-Type': TITLE_PHOTO_CONTENT_TYPE },
        expiresInSeconds: TITLE_PHOTO_URL_EXPIRY_SECONDS
    }, 200);
};

/**
 * Permissions the signed-in user holds in this service, from this service's rolePermissions table.
 * Display-only, for the UI; every endpoint still enforces its permission with requirePermission.
 * A "*" row is returned as "blog:*" so it can't be read as access to other services.
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
            permissions.add(permission === '*' ? 'blog:*' : permission);
        }
    }
    return response.createResponse({ permissions: [...permissions].sort() }, 200);
}
