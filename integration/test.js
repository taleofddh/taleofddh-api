/*
import * as drive from '@taleofddh/drive';
import * as secret from '@taleofddh/secret';
import fs from "fs";
import dotenv from 'dotenv';
import * as workbook from "@taleofddh/workbook";
dotenv.config();

//const query = "mimeType = 'application/vnd.google-apps.folder'";
const file = 'Kali Pujo 2025 Event Registration Test';
const query = "name = 'Kali Pujo 2025 Event Registration Test' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed != true";
const folder = "C:/Users/devad/workspace/taleofddh-api/integration/resources"
const fileId = "1ewDzqJvDhnX_0P6QYCtxH-vG7zNVxkw--_73U-Gq8ZE";
const type = "anyone";
const role = "reader";
const entity = {}
let jsonObject = [];
const reportFile = {
    "folder":"C:/Users/devad/workspace/taleofddh-api/integration/resources",
    "fileName":"Kali Pujo 2025 Event Registration Test.xlsx",
    "mimeType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

const createExcelFromJson = async (data, file, folder) => {
    fs.readFile('resources/Kali Pujo 2025.json', 'utf8', async (err, data) => {
        jsonObject = await JSON.parse(data);
        console.log(JSON.stringify(jsonObject));

        const reportFile = await workbook.createExcelFromJson(jsonObject, file, folder);

        console.log(JSON.stringify(reportFile));
    });
}

const listFiles = async (query) => {
    const driveService = drive.createService(await getCredentials('GOOGLE_API_CREDENTIALS_KEY'));
    const list = await driveService.listFiles(query);

    console.log(JSON.stringify(list));
}

const createFolder = async (folder) => {
    const driveService = drive.createService(await getCredentials('GOOGLE_API_CREDENTIALS_KEY'));
    const folderId = await driveService.createFolder(folder);

    console.log(JSON.stringify(folderId));
}

const uploadFile = async (file, fileId) => {
    const driveService = drive.createService(await getCredentials('GOOGLE_API_CREDENTIALS_KEY'));
    const uploadedFile = await driveService.uploadFile(file, fileId);

    console.log(JSON.stringify(uploadedFile));
}

const getFile = async (fileId) => {
    const file = drive.getFile(await getCredentials('GOOGLE_API_CREDENTIALS_KEY'), fileId);

    console.log(JSON.stringify(file));
}

const deleteFile = async (fileId) => {
    let params = {
        SecretId: process.env['GOOGLE_API_CREDENTIALS_KEY']
    }
    const googleApiCredentials = JSON.parse(await secret.getSecretValue(params));

    const driveService = await getDriveService(googleApiCredentials);

    const bodyValue = {
        'trashed': true
    };

    params = {
        fileId: fileId,
        requestBody: bodyValue,
    }

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        driveService.files.update(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

const listPermissions = async (fileId) => {
    let params = {
        SecretId: process.env['GOOGLE_API_CREDENTIALS_KEY']
    }
    const googleApiCredentials = JSON.parse(await secret.getSecretValue(params));

    const driveService = await getDriveService(googleApiCredentials);

    params = {
        fileId: fileId
    }

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        driveService.permissions.list(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                console.log(JSON.stringify(data));
                resolve(data);
            }
        });
    });
}

const createPermission = async (fileId, type, role, entity) => {
    let params = {
        SecretId: process.env['GOOGLE_API_CREDENTIALS_KEY']
    }
    const googleApiCredentials = JSON.parse(await secret.getSecretValue(params));

    const driveService = await getDriveService(googleApiCredentials);

    const permission = {
        type: type,
        role: role,
        ...entity
    }

    params = {
        resource: permission,
        fileId: fileId
    }

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        driveService.permissions.create(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                console.log(JSON.stringify(data));
                resolve(data);
            }
        });
    });
}

const getDriveService = async (credentials) => {
    // Create OAuth Client with Client Id, Client Secret & Redirect Url
    const oauth2Client = new oauth2.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
        'https://developers.google.com/oauthplayground'
    );

    // Access scopes for gmail.
    const scopes = [
        'https://www.googleapis.com/auth/drive.file'
    ];

    // Generate a url that asks permissions for gmail scope
    const authorizationUrl = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // Pass in the scopes array defined above.
        // Alternatively, if only one scope is needed, you can pass a scope URL as a string
        scope: scopes,
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true
    });


    // Variable that Hold Credentials for Authorization
    let tokens = {
            access_token: credentials.accessToken,
            refresh_token: credentials.refreshToken,
            scope: JSON.parse(credentials.driveScope),
            token_type: 'Bearer',
            expiry_date: credentials.expiryDate
        }

    oauth2Client.setCredentials(tokens);

    oauth2Client.on('tokens', async (tokens) => {
        //console.log(tokens);
        let secretValue = credentials;
        if (tokens.refresh_token && tokens.refresh_token !== secretValue.refreshToken) {
            // store the refresh_token in your secure persistent database
            secretValue = { ...secretValue, refreshToken: tokens.refresh_token, accessToken: tokens.access_token, expiryDate: tokens.expiry_date };
            //console.log("refresh_token", tokens.refresh_token);
            //console.log(secretValue);
            const params = {
                SecretId: process.env['GOOGLE_API_CREDENTIALS_KEY'],
                SecretString: JSON.stringify(secretValue)
            }
            await secret.putSecretValue(params);
        }
        //console.log("access_token", tokens.access_token);
    });

    return drive.drive({ version: 'v3', auth: oauth2Client });
}

const mimeTypeConversionFormat = (mimeType) => {
    let conversionFormat = ""

    switch(mimeType) {
        case 'application/msword':
            conversionFormat = 'application/vnd.google-apps.document';
            break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            conversionFormat = 'application/vnd.google-apps.document';
            break;
        case 'application/vnd.ms-excel':
            conversionFormat = 'application/vnd.google-apps.spreadsheet';
            break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            conversionFormat = 'application/vnd.google-apps.spreadsheet';
            break;
        case 'application/vnd.ms-powerpoint':
            conversionFormat = 'application/vnd.google-apps.presentation';
            break;
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            conversionFormat = 'application/vnd.google-apps.presentation';
            break;
        default:
            conversionFormat = mimeType;
            break;
    }

    return conversionFormat
}

const getCredentials = async (key) => {
    let params = {
        SecretId: process.env[key]
    }
    return JSON.parse(await secret.getSecretValue(params));
}

//const response = listFiles(query);
//const response = createFolder(folder);
//const response = getFile(fileId);
//const response = listPermissions(fileId);
//const response = createPermission(fileId, type, role, entity);
//const response = createExcelFromJson(jsonObject, file, folder);
//const response = uploadFile(reportFile, fileId);

*/
