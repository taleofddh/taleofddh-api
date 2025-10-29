'use strict';
import * as identity from '@taleofddh/identity';
import * as notification from '@taleofddh/notification';
import * as secret from "@taleofddh/secret";
import * as gmail from '@taleofddh/gmail';
import * as text from '@taleofddh/text';
import * as whatsapp from '@taleofddh/whatsapp';
import * as drive from '@taleofddh/drive';
import * as workbook from '@taleofddh/workbook';
import * as response from '@taleofddh/response';

export const sendEmailMessage = async (event) => {
    const res = JSON.parse(event.Records[0].body);
    const data = JSON.parse(res.Message);
    switch(data.template) {
        case 'Enquiry':
            await sendEnquiryMessage(data);
            break;
        case 'Membership':
            await sendMembershipMessage(data);
            break;
        case 'Sponsorship':
            await sendSponsorshipMessage(data);
            break;
        case 'EventRegistration':
            await sendEventRegistrationMessage(data);
            break;
        case 'RegistrationReportLink':
            await sendRegistrationReportMessage(data);
            break;
        default:
            break;
    }
}

const sendEnquiryMessage = async (data) => {
    const request = {
        "name" : data.name,
        "subject": data.subject + ' # ' + data.number,
        "number": data.number,
        "message": data.text
    };

    const message = await sendGmailMessage(data.to, data.template, request);
    return response.createResponse(message, 200);
};

const sendMembershipMessage = async (data) => {
    const request = {
        "name" : data.name,
        "subject": data.subject + ' # ' + data.number,
        "number": data.number,
        "email": data.email,
        "city": data.city,
        "countryCode": data.countryCode,
        "phone": data.phone,
        "message": data.text
    };

    const message = await sendGmailMessage(data.to, data.template, request);
    return response.createResponse(message, 200);
};

const sendSponsorshipMessage = async (data) => {
    const request = {
        "name" : data.name,
        "subject": data.subject + ' # ' + data.number,
        "number": data.number,
        "company": data.company,
        "registration": data.registration,
        "email": data.email,
        "phone": data.phone,
        "message": data.text
    };

    const message = await sendGmailMessage(data.to, data.template, request);
    return response.createResponse(message, 200);
};

const sendEventRegistrationMessage = async (data) => {
    const registration = {
        ...data,
        "subject": data.subject + ' # ' + data.number
    }
    /*const ccList = data.contactList.map((item) => {
        return item.email;
    })
    console.log(JSON.stringify(ccList));*/

    const message = await sendGmailMessage(data.to, data.template, registration);
    return response.createResponse(message, 200);
}

const sendRegistrationReportMessage = async (data) => {
    const reportLink = {
        ...data,
    }
    const toList = data.contactList.map((item) => {
        return item.email;
    })
    console.log(JSON.stringify(toList));

    const message = await sendGmailMessage(toList, data.template, data);
    return response.createResponse(message, 200);
}

const sendGmailMessage = async (to, template, data) => {
    const gmailService = gmail.createService(await getCredentials('GOOGLE_API_CREDENTIALS_KEY'));

    const message = await gmailService.send(to, template, data, [process.env['COPY_ADDRESS']], '', text.get(template, data));
    console.log("Sent Message " + JSON.stringify(message));

    return message;
}

export const sendWhatsAppMessage = async (event) => {
    console.log(event);
    const res = event.Records[0].Sns;
    const data = JSON.parse(res.Message);
    switch(data.template) {
        case 'event_attendance':
            await sendEventAttendanceMessage(data);
            break;
        default:
            break;
    }
}

const sendEventAttendanceMessage = async (data) => {
    const components = [
        {
            'type': 'header',
            'parameters': [
                {
                    'type': 'text',
                    'text': data.name
                }
            ]
        },
        {
            'type': 'body',
            'parameters': [
                {
                    'type': 'text',
                    'text': data.paymentDeadline
                },{
                    'type': 'text',
                    'text': data.memberAdultPrice
                },
                {
                    'type': 'text',
                    'text': data.memberChildPrice
                },
                {
                    'type': 'text',
                    'text': data.consolidatedAttendances
                },
                {
                    'type': 'text',
                    'text': data.totalGroupAttendance
                },
                {
                    'type': 'text',
                    'text': process.env['WHATSAPP_GROUP_NAME']
                }
            ]
        }
    ]

    const whatsappService = whatsapp.createService(await getCredentials('WHATSAPP_CREDENTIALS_KEY'));

    const message = await whatsappService.send(data.to, data.template, components);
    console.log("Sent Message " + JSON.stringify(message));

    return response.createResponse(message, 200);
};

export const createOrUpdateReportFile = async (event) => {
    const res = event.Records[0].Sns;
    const data = JSON.parse(res.Message);
    switch(data.template) {
        case 'EventRegistrationReport':
            await createOrUpdateEventRegistrationReport(data);
            break;
        default:
            break;
    }
}

const createOrUpdateEventRegistrationReport = async (data) => {
    console.log(JSON.stringify(data.report));

    const fileName = data.report.name + ' Event Registration' + (process.env['ENVIRONMENT'] === 'prod' ? ' Final' : ' Test');
    const reportFile = await workbook.createExcelFromJson(data.report, fileName, '/tmp');

    const driveService = drive.createService(await getCredentials('GOOGLE_API_CREDENTIALS_KEY'));

    const list = await driveService.listFiles("name = '" + fileName + "' and mimeType = '" + driveService.mimeTypeConversionFormat(reportFile.mimeType) + "' and trashed != true");

    const files = list.data.files;

    // If Existing File Populate fileId
    const fileId = files.length > 0 ? files[0].id  : ""

    const uploadedFile = await driveService.uploadFile(reportFile, fileId);

    console.log("Uploaded File " + JSON.stringify(uploadedFile));

    const file = await driveService.getFile(uploadedFile.data.id);
    //console.log(file);

    // Check permissions for the file
    const permissions = await driveService.listPermissions(uploadedFile.data.id);

    // Validate if general reader permission is granted
    let generalReaderPermission = false;
    permissions.data.permissions.forEach((item) => {
        if(item.role === 'reader' && item.type === 'anyone') {
            generalReaderPermission = true;
        }
    });

    // Grant general reader permission is not granted already
    if(!generalReaderPermission) {
        await driveService.createPermission(uploadedFile.data.id, 'anyone', 'reader', {});
    }

    //Send Notification after creating the file first time
    if(fileId === "") {
        await eventReportPublish(data, fileName, file.data.webViewLink, data.contactList);
    }

    return response.createResponse(uploadedFile, 200);
}

const eventReportPublish = async (data, fileName, fileLink, contactList) => {
    const callerIdentity = await identity.get({})

    const name = contactList.map((item) => item.name).join(', ');

    //const name = names.join(', ');

    const messageData = {
        "name" : name,
        "subject": "Event Registration Report " + data.report.name,
        "reportName": data.report.name,
        "fileName": fileName,
        "link": fileLink,
        "contactList": contactList,
        template: 'RegistrationReportLink'
    }

    console.log(messageData);

    const params = {
        Message: JSON.stringify(messageData),
        TopicArn: 'arn:aws:sns:' + process.env['REGION'] + ':' + callerIdentity.Account + ':' + process.env['EMAIL_NOTIFICATION_TOPIC']
    }

    const publishNotification = await notification.publish(params);

    console.log(publishNotification);
}

const getCredentials = async (key) => {
    let params = {
        SecretId: process.env[key]
    }
    return JSON.parse(await secret.getSecretValue(params));
}

/*
const formatMoney = (amount, decimalCount = 2, decimal = ".", thousands = ",") => {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? "-" : "";

        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
        console.log(e)
    }
};*/
