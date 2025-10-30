'use strict';
import * as database from '@taleofddh/database';
import * as response from '@taleofddh/response';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];

export const findMenuList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const params = {
        TableName: table,
        FilterExpression: '#active = :active_val',
        ExpressionAttributeNames: {
            '#active': 'active',
        },
        ExpressionAttributeValues: {':active_val': active}
    };
    const menus = await database.scan(params);
    menus.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(menus, 200);
};

export const findPromotionList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const params = {
        TableName: table,
        FilterExpression: '#active = :active_val',
        ExpressionAttributeNames: {
            '#active': 'active',
        },
        ExpressionAttributeValues: {':active_val': active}
    };
    const promotions = await database.scan(params);
    promotions.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(promotions, 200);
};

export const findAboutUsList = async (event) => {
    const params = {
        TableName: table
    };
    const aboutUsList = await database.scan(params);
    aboutUsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(aboutUsList, 200);
};

export const findTermsAndConditionsList = async (event) => {
    const params = {
        TableName: table
    };
    const termsAndConditionsList = await database.scan(params);
    termsAndConditionsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(termsAndConditionsList, 200);
};

export const findPrivacyPolicyList = async (event) => {
    const params = {
        TableName: table
    };
    const privacyPolicyList = await database.scan(params);
    privacyPolicyList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(privacyPolicyList, 200);
};

export const findFrequentlyAskedQuestionList = async (event) => {
    const params = {
        TableName: table
    };
    const frequentlyAskedQuestionList = await database.scan(params);
    frequentlyAskedQuestionList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(frequentlyAskedQuestionList, 200);
};

export const findCountryByCode = async (event) => {
    let countryCode  = event.pathParameters.countryCode;
    const params = {
        TableName: table,
        KeyConditionExpression: '#code = :code',
        ExpressionAttributeNames: {
            '#code': 'code',
        },
        ExpressionAttributeValues: {':code': countryCode}
    };
    const country = await database.query(params);

    return response.createResponse(country, 200);
};

export const findCountryByName = async (event) => {
    let countryName  = event.pathParameters.countryName;
    const params = {
        TableName: table,
        FilterExpression: '#name = :name',
        ExpressionAttributeNames: {
            '#name': 'name',
        },
        ExpressionAttributeValues: {':name': countryName}
    };
    const country = await database.scan(params);
    return response.createResponse(country, 200);
};

export const createAuditEntry = async (event) => {
    const data = JSON.parse(event.body);
    const doc = {
        TableName: table,
        Item: {
            "date": data.date,
            "hostName": data.hostName,
            "countryCode": data.countryCode,
            "ipAddress": data.ipAddress,
            "page": data.page,
            "message": data.message
        }
    }
    console.log("Audit", doc);
    return response.createResponse(doc, 200);
};