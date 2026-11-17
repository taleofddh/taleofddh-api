// SEO back-fill for <ENVIRONMENT>.<APP_NAME>.blog.blog.
//   - sets updatedDateTime from endDateTime (or startDateTime) where missing
// Blogs have no description to derive a summary from, so it only reports blogs still missing summary or titlePhotoAlt.
//
// Dry run is the default: it prints the changes and writes nothing.
//   ENVIRONMENT=dev node dataload3.js                 dry run
//   ENVIRONMENT=dev node dataload3.js --write         apply
//   ENVIRONMENT=prod node dataload3.js --write --backup-confirmed
// Production writes are refused without --backup-confirmed. Take the table backup first, for example:
//   aws dynamodb create-backup --table-name prod.taleofddh.blog.blog --backup-name blog-pre-seo-backfill --profile taleofddh
// Option: --top=N (default 15) lists the most viewed blogs to rewrite first.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
dotenv.config();

// database.scan reads one page only (1 MB) and returns [] on error; a back-fill must see every item or fail loudly.
const scanAll = async (TableName) => {
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env['REGION'] || 'eu-west-1' }));
    const items = [];
    let ExclusiveStartKey;
    do {
        const page = await client.send(new ScanCommand({ TableName, ExclusiveStartKey }));
        items.push(...page.Items);
        ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
};

const args = process.argv.slice(2);
const write = args.includes('--write');
const backupConfirmed = args.includes('--backup-confirmed');
const top = parseInt((args.find((a) => a.startsWith('--top=')) || '--top=15').split('=')[1], 10) || 15;
const environment = process.env['ENVIRONMENT'] || 'dev';
const table = `${environment}.${process.env['APP_NAME'] || 'taleofddh'}.blog.blog`;

if (write && environment === 'prod' && !backupConfirmed) {
    console.error('Refusing to write to prod without --backup-confirmed. Back up the table first (see the header of this file).');
    process.exit(1);
}

const blogs = await scanAll(table);
console.log(`${write ? 'WRITE' : 'DRY RUN'} on ${table}: ${blogs.length} blogs`);

let changed = 0;
for (const blog of blogs) {
    if (blog.updatedDateTime) continue;
    const updatedDateTime = blog.endDateTime || blog.startDateTime;
    if (!updatedDateTime) continue;
    changed++;
    console.log(`${write ? 'UPDATE' : 'would update'} ${blog.category}/${blog.name}`, JSON.stringify({ updatedDateTime }));
    if (write) {
        await database.update({
            TableName: table,
            Key: { name: blog.name, startDateTime: blog.startDateTime },
            ConditionExpression: 'attribute_exists(#name)',
            UpdateExpression: 'SET #updatedDateTime = :updatedDateTime',
            ExpressionAttributeNames: { '#name': 'name', '#updatedDateTime': 'updatedDateTime' },
            ExpressionAttributeValues: { ':updatedDateTime': updatedDateTime }
        });
    }
}
console.log(`\n${changed} blogs ${write ? 'updated' : 'would change'}`);

const list = (title, items) => {
    console.log(`\n${title}: ${items.length}`);
    for (const b of items) console.log(`  ${b.category}/${b.name}`);
};
list('Blogs with no summary', blogs.filter((b) => !b.summary));
list('Blogs with no titlePhotoAlt', blogs.filter((b) => !b.titlePhotoAlt));
console.log(`\nTop ${top} blogs by viewCount (rewrite these first)`);
[...blogs].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, top).forEach((b, i) => {
    const missing = ['summary', 'titlePhotoAlt'].filter((f) => !b[f]);
    console.log(`  ${i + 1}. ${b.category}/${b.name}  views=${b.viewCount || 0}  missing: ${missing.join(', ') || 'none'}`);
});
