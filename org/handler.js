import * as database from '@taleofddh/database';
import * as distribution from '@taleofddh/distribution';
import * as storage from '@taleofddh/storage';
import * as response from '@taleofddh/response';
import * as secret from '@taleofddh/secret';
const bucketName = process.env['S3_BUCKET'];
const key = process.env['ENVIRONMENT'] + '/' + process.env['SERVICE_NAME'] + '/' + process.env['OBJECT_NAME'] + '.json';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];

export const findAboutUsList = async (event) => {
    let params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const aboutUsList = JSON.parse(await res.Body.transformToString());

    const prefix = process.env['MEDIA_PROTECTED_HOST'] + '/protected/images/about-us/';
    const signerPrivateKey = await secret.getSecretValue({SecretId: process.env['SIGNER_PRIVATE_KEY']});
    const signatureParams = distribution.getSignatureParameters(
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
            aboutUsList[i].signedUrl = distribution.getSignedUrlWithPolicy(params);
        }
    }

    aboutUsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(aboutUsList, 200);
};

export const findRoleBasedMenuList = async (event) => {
    const data = JSON.parse(event.body);
    let active  = (data.active === 'true');
    let roles = data.roles;
    const params = {
        Bucket: bucketName,
        Key: key
    };
    const res = await storage.getObject(params);
    const menus = JSON.parse(await res.Body.transformToString());
    menus.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    const roleBasedMenus = menus.filter(item => {
        return item.active === active && roles.includes(item.roleCode) && item.name !== 'My Account';
    });
    return response.createResponse(roleBasedMenus, 200);
};

export const findPeopleList = async (event) => {
    const active  = (event.pathParameters.active === 'true');
    const params = {
        TableName: table,
        FilterExpression: '#active = :active_val',
        ExpressionAttributeNames: {
            '#active': 'active',
        },
        ExpressionAttributeValues: {':active_val': active}
    };
    const people = await database.scan(params);
    people.sort((a,b) => (a.familyCode.localeCompare(b.familyCode)));
    return response.createResponse(people, 200);
};

export const findFamilyByEmail = async (event) => {
    const active  = (event.pathParameters.active === 'true');
    const email = decodeURI(event.pathParameters.email);

    const params = {
        TableName: table,
        FilterExpression: `#active = :active and #type = :type`,
        ExpressionAttributeNames: {
            '#active': 'active',
            '#type': 'type'
        },
        ExpressionAttributeValues: {
            ":active": active,
            ":type": 'Family'
        }
    }

    const communities = await database.scan(params);

    let community = {};
    for(let i = 0; i < communities.length; i++) {
        for(let j = 0; j < communities[i].members.length; j++) {
            if(communities[i].members[j].emails.includes(email)) {
                community = communities[i];
                break;
            }
        }
    }

    return response.createResponse(community, 200);
}