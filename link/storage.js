const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, SelectObjectContentCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// a client can be shared by different commands.
const client = new S3Client({region: process.env['REGION']});

module.exports.listBucket = async (params) => {
    const command = new ListObjectsV2Command(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        client.send(command, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                console.log(data);
                let objects = data.CommonPrefixes.map((commonPrefix) => {
                    return commonPrefix.Prefix.substring(params.Prefix.length).replace('/', '');
                });
                console.log(objects);
                resolve(objects);
            }
        });
    });
}

module.exports.listFolder = async (params) => {
    const command = new ListObjectsV2Command(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        client.send(command, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                console.log(data);
                let objects = data.Contents.map((object) => {
                    return object.Key.substring(params.Prefix.length);
                });
                console.log(objects);
                resolve(objects);
            }
        });
    });
}

module.exports.getObject = async (params) => {
    const command = new GetObjectCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        client.send(command, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.putObjectSignedUrl = async (params) => {
    const command = new PutObjectCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise(async (resolve, reject) => {
        try {
            const data = await getSignedUrl(client, command, { expiresIn: 3600 });
            resolve(data);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports.getObjectSignedUrl = async (params) => {
    const command = new GetObjectCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise(async (resolve, reject) => {
        try {
            const data = await getSignedUrl(client, command, { expiresIn: 3600 });
            resolve(data);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports.putObject = async (params) => {
    const command = new PutObjectCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        client.send(command, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.deleteObject = async (params) => {
    const command = new DeleteObjectCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        client.send(command, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.selectObjectContent = async (params) => {
    const command = new SelectObjectContentCommand(params);

    // for async it only works with Promise and resolve/reject
    return new Promise((resolve, reject) => {
        client.send(command, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}