'use strict';
const database = require('./db');
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];

module.exports.findIdentity = async (event) => {
    let userId = event.requestContext.identity.cognitoIdentityId;
    const identity = {
        identityId: userId
    }
    return {
        statusCode: 200,
        body: JSON.stringify(identity),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findUser = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        Key: {
            "username": data.username,
            "password": data.password
        }
    }
    const user = await database.get(params);
    return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.createUser = async (event) => {
    const data = JSON.parse(event.body);
    const profile = {
        table: 'userProfile',
        number: sequence,
        identityId: data.userProfile.identityId,
        email: data.userProfile.email,
        mailingFlag: true
    }
    const userProfile = await createProfile(profile);

    const newUser = {
        TableName: table,
        Item: {
            "number": sequence,
            "username": data.username,
            "password": data.password,
            "userProfile": userProfile
        }
    }

    const user = await database.put(newUser);

    return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.updateUser = async (event) => {
    const data = JSON.parse(event.body);
    let update = [];
    let expAttrValues = {};
    if(data.hasOwnProperty('password')) {
        update.push('password = :password');
        expAttrValues[":password"] = data.password;
    }

    let updateExpr = 'SET ';
    for(let i in update) {
        if(i > 0)  {
            updateExpr += ', ';
        }
        updateExpr += update[i];
    }

    expAttrValues['username'] = data.username;

    let params = {
        TableName: table,
        ConditionExpression: 'username = :username',
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: expAttrValues,
        ReturnValues: 'ALL_NEW'
    };
    const user = (!userId || userId === undefined) ? {} : await database.update(params);
    return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findUserProfile = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    let params = data.email ?
        {
            TableName: table,
            FilterExpression: '#email = :email and #identityId = :identityId',
            ExpressionAttributeNames: {
                '#email': 'email',
                '#identityId': 'identityId'
            },
            ExpressionAttributeValues: {
                ':email': data.email,
                ':identityId': data.identityId ? data.identityId : userId
            }
        } : {
            TableName: table,
            FilterExpression: '#identityId = :identityId',
            ExpressionAttributeNames: {
                '#identityId': 'identityId'
            },
            ExpressionAttributeValues: {
                ':identityId': data.identityId ? data.identityId : userId
            }
        };
    const userProfile = (!userId || userId === undefined) ? {} : await database.scan(params);
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile[0]),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.createUserProfile = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    let params = data.email ?
        {
            TableName: table,
            FilterExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': data.email
            }
        } : {
            TableName: table,
            FilterExpression: '#identityId = :identityId',
            ExpressionAttributeNames: {
                '#identityId': 'identityId'
            },
            ExpressionAttributeValues: {
                ':identityId': data.identityId
            }
        };
    const existingProfile = await database.scan(params);
    let userProfile;
    if(existingProfile.length === 0) {
        userProfile = await createProfile(data, userId);
    } else {
        userProfile = await updateProfile(data, userId, existingProfile[0].number);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

const createProfile = async (data, userId) => {
    let params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'sequence',
        Key: {
            "key": "user_seq"
        },
        UpdateExpression: "SET #sequence = #sequence + :inc",
        ExpressionAttributeNames: {
            "#sequence": "sequence"
        },
        ExpressionAttributeValues: { ":inc": 1 },
        ReturnValues: "ALL_NEW"
    }
    const sequenceDoc = await database.update(params);

    let communityList = [];
    params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'community'
    }
    const allCommunities = await database.scan(params)
    allCommunities.sort((a, b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
    for(let i in allCommunities) {
        communityList.push({"id": allCommunities[i].number, "name": allCommunities[i].name, "checked": false})
    }
    const profile = {
        TableName: data.hasOwnProperty('table') ? process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + data.table : table,
        Item: {
            "number": sequenceDoc.sequence,
            "identityId": data.identityId,
            "firstName": data.firstName ? data.firstName : '',
            "lastName": data.lastName ? data.lastName : '',
            "dateOfBirth": data.dateOfBirth ? new Date(data.dateOfBirth) : '',
            "gender": data.gender ? data.gender : '',
            "email": data.email ? data.email : '',
            "address1": data.address1 ? data.address1 : '',
            "address2": data.address2 ? data.address2 : '',
            "city": data.city ? data.city : '',
            "postCode": data.postCode ? data.postCode : '',
            "countryCode": data.countryCode ? data.countryCode : '',
            "phone": data.phone ? data.phone : '',
            "about": data.about ? data.about : '',
            "communityList": data.communityList ? data.communityList : communityList,
            "mailingFlag": data.mailingFlag ? data.mailingFlag.toUpperCase() === 'TRUE' : true,
            "updatedAt": JSON.parse(JSON.stringify(new Date())),
            "lastLogin": JSON.parse(JSON.stringify(new Date()))
        }
    }
    params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'sequence',
        Key: {
            "key": "userRole_seq"
        },
        UpdateExpression: "SET #sequence = #sequence + :inc",
        ExpressionAttributeNames: {
            "#sequence": "sequence"
        },
        ExpressionAttributeValues: { ":inc": 1 },
        ReturnValues: "ALL_NEW"
    }
    const roleSequenceDoc = await database.update(params);
    params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'role',
        Key: {
            "name": "User",
        }
    };
    const defaultRole = await database.get(params);
    const userRole = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'userRole',
        Item: {
            number: roleSequenceDoc.sequence,
            userNumber: sequenceDoc.sequence,
            roleList: [{
                id: defaultRole.number,
                name: defaultRole.name
            }]
        }
    }
    await database.put(userRole);
    const doc = (!userId || userId === undefined) ? {} : await database.put(profile);
    params = {
        TableName: data.hasOwnProperty('table') ? process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + data.table : table,
        Key: {
            "number": sequenceDoc.sequence
        }
    }
    return await database.get(params);
}

module.exports.updateUserProfile = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    let params = data.email ?
        {
            TableName: table,
            FilterExpression: '#email = :email and #identityId = :identityId',
            ExpressionAttributeNames: {
                '#email': 'email',
                '#identityId': 'identityId'
            },
            ExpressionAttributeValues: {
                ':email': data.email,
                ':identityId': data.identityId
            }
        } : {
            TableName: table,
            FilterExpression: '#identityId = :identityId',
            ExpressionAttributeNames: {
                '#identityId': 'identityId'
            },
            ExpressionAttributeValues: {
                ':identityId': data.identityId
            }
        };
    const existingProfile = await database.scan(params);
    let userProfile;
    if(existingProfile.length === 0) {
        userProfile = await createProfile(data, userId);
    } else {
        userProfile = await updateProfile(data, userId, existingProfile[0].number);
    }
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

const updateProfile = async (data, userId, userNumber) => {
    let update = [];
    let expAttrValues = {};
    if(data.hasOwnProperty('identityId')) {
        update.push('identityId = :identityId');
        expAttrValues[":identityId"] = data.identityId
    }
    if(data.hasOwnProperty('firstName')) {
        update.push('firstName = :firstName');
        expAttrValues[":firstName"] = data.firstName
    }
    if(data.hasOwnProperty('lastName')) {
        update.push('lastName = :lastName');
        expAttrValues[":lastName"] = data.lastName;
    }
    if(data.hasOwnProperty('dateOfBirth')) {
        update.push('dateOfBirth = :dateOfBirth');
        expAttrValues[":dateOfBirth"] = data.dateOfBirth;
    }
    if(data.hasOwnProperty('gender')) {

        update.push('gender = :gender');
        expAttrValues[":gender"] = data.gender;
    }
    if(data.hasOwnProperty('address1')) {
        update.push('address1 = :address1');
        expAttrValues[":address1"] = data.address1;
    }
    if(data.hasOwnProperty('address2')) {

        update.push('address2 = :address2');
        expAttrValues[":address2"] = data.address2;
    }
    if(data.hasOwnProperty('city')) {

        update.push('city = :city');
        expAttrValues[":city"] = data.city;
    }
    if(data.hasOwnProperty('postCode')) {

        update.push('postCode = :postCode');
        expAttrValues[":postCode"] = data.postCode;
    }
    if(data.hasOwnProperty('countryCode')) {

        update.push('countryCode = :countryCode');
        expAttrValues[":countryCode"] = data.countryCode;
    }
    if(data.hasOwnProperty('phone')) {

        update.push('phone = :phone');
        expAttrValues[":phone"] = data.phone;
    }
    if(data.hasOwnProperty('about')) {

        update.push('about = :about');
        expAttrValues[":about"] = data.about;
    }
    if(data.hasOwnProperty('communityList')) {

        update.push('communityList = :communityList');
        expAttrValues[":communityList"] = data.communityList;
    }
    if(data.hasOwnProperty('mailingFlag')) {

        update.push('mailingFlag = :mailingFlag');
        expAttrValues[":mailingFlag"] = data.mailingFlag;
    }
    if(data.hasOwnProperty('updatedAt') && !data.lastLogin) {
        update.push('updatedAt = :updatedAt');
        expAttrValues[":updatedAt"] = data.updatedAt;
    }
    if(data.hasOwnProperty('lastLogin')) {
        update.push('lastLogin = :lastLogin');
        expAttrValues[":lastLogin"] = data.lastLogin;
    }

    let updateExpr = '';
    for(let i = 0; i < update.length; i++) {
        if(i === 0) {
            updateExpr += 'SET ';
        } else {
            updateExpr += ', ';
        }
        updateExpr += update[i];
    }

    let conditionalExpr = '';
    if(data.email) {
        conditionalExpr = 'email = :email and identityId = :identityId';
        expAttrValues[':email'] = data.email;
        expAttrValues[':identityId'] = data.identityId;
    } else {
        conditionalExpr = 'identityId = :identityId'
        expAttrValues[':identityId'] = data.identityId;
    }

    let params = {
        TableName: table,
        Key: {
            "number": userNumber
        },
        ConditionExpression: conditionalExpr,
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: expAttrValues,
        ReturnValues: 'ALL_NEW'
    };
    const userProfile = (!userId || userId === undefined) ? {} : await database.update(params);
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findUserRole = async (event) => {
    const data = JSON.parse(event.body);
    let identityId = event.requestContext.identity.cognitoIdentityId;
    let params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'userProfile',
        FilterExpression: '#identityId = :identityId',
        ExpressionAttributeNames: {
            '#identityId': 'identityId',
        },
        ExpressionAttributeValues: {':identityId': identityId}
    };
    const userProfile = await database.scan(params);
    let userRole;
    if(userProfile) {
        params = {
            TableName: table,
            Key: {
                "userNumber": userProfile[0].number
            }
        };
        userRole = await database.get(params);
    } else {
        userRole = {};
    }
    return {
        statusCode: 200,
        body: JSON.stringify(userRole),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
}