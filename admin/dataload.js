// Seeds <ENVIRONMENT>.<APP_NAME>.admin.rolePermissions.
// One item per Cognito group: { role, permissions }. "*" grants every permission.
// Rows are upserted; roles added directly in the table and not listed here are left untouched.
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
dotenv.config();
const rolePermissions = [
    { role: 'admin', permissions: ['*'] }
];
await database.operation('writeItems', 'rolePermissions', rolePermissions.map(item => ({ PutRequest: { Item: item } })));
const docs = await database.operation('getItems', 'rolePermissions', rolePermissions.map(({ role }) => ({ role })));
console.log(JSON.stringify(docs, null, 2));
console.log(`Seeded ${rolePermissions.length} roles`);
