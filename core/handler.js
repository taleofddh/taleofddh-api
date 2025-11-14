'use strict';
import * as distribution from '@taleofddh/distribution';
import * as response from '@taleofddh/response';
import * as secret from '@taleofddh/secret';
import * as storage from '@taleofddh/storage';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucketName = process.env['S3_BUCKET'];
const key = process.env['ENVIRONMENT'] + '/' + process.env['SERVICE_NAME'] + '/' + process.env['OBJECT_NAME'] + '.json';

export const findMenuList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const menus = JSON.parse(await res.Body.transformToString());
    const activeMenus = menus.filter((item) => {
        return item.active === active
    })
    activeMenus.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(activeMenus, 200);
};

export const findPromotionList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const promotions = JSON.parse(await res.Body.transformToString());
    const activePromotions = promotions.filter((item) => {
        return item.active === active
    })
    activePromotions.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(activePromotions, 200);
};

export const findAboutUsList = async (event) => {
    let params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const aboutUsList = JSON.parse(await res.Body.transformToString());

    const prefix = process.env['MEDIA_PROTECTED_HOST'] + '/protected/images/about-us/';
    const signerPrivateKey = await secret.getSecretValue({SecretId: process.env['SIGNER_PRIVATE_KEY']});
    const signatureParams = await distribution.getSignatureParameters(
        process.env['CLOUDFRONT_PUBLIC_KEY_ID'],
        signerPrivateKey,
        true,
        prefix
    );

    for (let i = 0; i < aboutUsList.length; i++) {
        if (aboutUsList[i].image) {
            params = {
                ...signatureParams,
                url: prefix + aboutUsList[i].image
            }
            aboutUsList[i].signedUrl = await distribution.getSignedUrlWithPolicy(params);
        }
    }

    aboutUsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(aboutUsList, 200);
};

export const findTermsAndConditionsList = async (event) => {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const termsAndConditionsList = JSON.parse(await res.Body.transformToString());
    termsAndConditionsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(termsAndConditionsList, 200);
};

export const findPrivacyPolicyList = async (event) => {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const privacyPolicyList = JSON.parse(await res.Body.transformToString());
    privacyPolicyList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(privacyPolicyList, 200);
};

export const findFrequentlyAskedQuestionList = async (event) => {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const frequentlyAskedQuestionList = JSON.parse(await res.Body.transformToString());
    frequentlyAskedQuestionList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(frequentlyAskedQuestionList, 200);
};

export const findCountryByCode = async (event) => {
    let countryCode  = event.pathParameters.countryCode;
    const params = {
        Bucket: bucketName,
        Key: key,
        ExpressionType: 'SQL',
        Expression: 'SELECT code, name FROM S3Object WHERE code = ' + countryCode,
        InputSerialization: {
            CompressionType: 'NONE',
            JSON: {
                Type: 'DOCUMENT'
            }
        },
        OutputSerialization: {
            JSON: {}
        }
    }
    const country = await storage.selectObjectContent(params);

    return response.createResponse(country, 200);
};

export const findCountryByName = async (event) => {
    let countryName  = event.pathParameters.countryName;
    const params = {
        Bucket: bucketName,
        Key: key,
        ExpressionType: 'SQL',
        Expression: 'SELECT code, name FROM S3Object WHERE name = ' + countryName,
        InputSerialization: {
            CompressionType: 'NONE',
            JSON: {
                Type: 'DOCUMENT'
            }
        },
        OutputSerialization: {
            JSON: {}
        }
    }
    const country = await storage.selectObjectContent(params);

    return response.createResponse(country, 200);
};

export const createAuditEntry = async (event) => {
    const data = JSON.parse(event.body);
    const doc = {
        "date": data.date,
        "hostName": data.hostName,
        "countryCode": data.countryCode,
        "ipAddress": data.ipAddress,
        "page": data.page,
        "message": data.message
    }
    console.log("Audit", doc);
    return response.createResponse(doc, 200);
};