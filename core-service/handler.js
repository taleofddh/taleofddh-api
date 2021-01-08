'use strict';
const database = require('./db');
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];

module.exports.findMenuList = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(menus),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findPromotionList = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(promotions),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findAboutUsList = async (event) => {
    const params = {
        TableName: table
    };
    const aboutUsList = await database.scan(params);
    aboutUsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return {
        statusCode: 200,
        body: JSON.stringify(aboutUsList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findTermsAndConditionsList = async (event) => {
    const params = {
        TableName: table
    };
    const termsAndConditionsList = await database.scan(params);
    termsAndConditionsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return {
        statusCode: 200,
        body: JSON.stringify(termsAndConditionsList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findPrivacyPolicyList = async (event) => {
    const params = {
        TableName: table
    };
    const privacyPolicyList = await database.scan(params);
    privacyPolicyList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return {
        statusCode: 200,
        body: JSON.stringify(privacyPolicyList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findFrequentlyAskedQuestionList = async (event) => {
    const params = {
        TableName: table
    };
    const frequentlyAskedQuestionList = await database.scan(params);
    frequentlyAskedQuestionList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return {
        statusCode: 200,
        body: JSON.stringify(frequentlyAskedQuestionList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findCountryByCode = async (event) => {
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

    return {
        statusCode: 200,
        body: JSON.stringify(country),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findCountryByName = async (event) => {
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
    return {
        statusCode: 200,
        body: JSON.stringify(country),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.createAuditEntry = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
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
    const doc = await database.put(params);
    return {
        statusCode: 200,
        body: JSON.stringify(doc),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};