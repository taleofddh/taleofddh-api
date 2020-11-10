const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });

module.exports = async (env) => {
    const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
    const encrypted = process.env[env];

    if (!process.env[env]) {
        throw Error(`Environment variable ${env} not found`)
    }

    const kms = new AWS.KMS();
    try {
        const data = await kms.decrypt({
            CiphertextBlob: Buffer.from(process.env[env], 'base64'),
            EncryptionContext: { LambdaFunctionName: functionName },
        }).promise();
        console.info(`Environment variable ${env} decrypted`)
        return data.Plaintext.toString('ascii');
    } catch (err) {
        console.log('Decryption error:', err);
        throw err;
    }
}