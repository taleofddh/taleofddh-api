// SEO back-fill for <ENVIRONMENT>.<APP_NAME>.gallery.gallery.
//   - sets updatedDateTime from endDateTime (or startDateTime) where missing
//   - derives summary from description where summary is missing and the description is long enough (120+ characters)
//   - with --video-count, sets videoCount from the protected media folder where missing or different
// It also reports albums still missing summary or coverAlt, and lists the albums with the highest viewCount
// so editors know which to rewrite first.
//
// Dry run is the default: it prints the changes and writes nothing.
//   ENVIRONMENT=dev node dataload5.js                 dry run
//   ENVIRONMENT=dev node dataload5.js --write         apply
//   ENVIRONMENT=prod node dataload5.js --write --backup-confirmed
// Production writes are refused without --backup-confirmed. Take the table backup first, for example:
//   aws dynamodb create-backup --table-name prod.taleofddh.gallery.gallery --backup-name gallery-pre-seo-backfill --profile taleofddh
// Options: --top=N (default 15), --video-count
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import * as storage from '@taleofddh/storage';
import { deriveSummary, MIN_SUMMARY_LENGTH } from './seo-text.js';
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
const withVideoCount = args.includes('--video-count');
const top = parseInt((args.find((a) => a.startsWith('--top=')) || '--top=15').split('=')[1], 10) || 15;
const environment = process.env['ENVIRONMENT'] || 'dev';
const table = `${environment}.${process.env['APP_NAME'] || 'taleofddh'}.gallery.gallery`;
const bucket = process.env['S3_MEDIA_BUCKET'] || 'taleofddh-media';

if (write && environment === 'prod' && !backupConfirmed) {
    console.error('Refusing to write to prod without --backup-confirmed. Back up the table first (see the header of this file).');
    process.exit(1);
}

const slug = (value) => value.replace(/&/g, 'and').replace(/ /g, '-').toLowerCase();
const videoPrefix = (a) => 'protected/videos/gallery/' + [a.category, a.subCategory, a.collection, a.name].map(slug).join('/') + '/';

const albums = await scanAll(table);
console.log(`${write ? 'WRITE' : 'DRY RUN'} on ${table}: ${albums.length} albums`);

const changes = [];
for (const album of albums) {
    const set = {};
    if (!album.updatedDateTime) {
        const value = album.endDateTime || album.startDateTime;
        if (value) set.updatedDateTime = value;
    }
    if (!album.summary && album.description) {
        const summary = deriveSummary(album.description);
        // Short descriptions make weak meta descriptions and would fail the 120 character rule on the next edit,
        // so those albums stay without a stored summary and show up in the report below.
        if ([...summary].length >= MIN_SUMMARY_LENGTH) set.summary = summary;
    }
    if (withVideoCount) {
        // Recomputed every time (a stored 0 may be stale); only written when it differs.
        const items = await storage.listFolder({ Bucket: bucket, Delimiter: '/', Prefix: videoPrefix(album) });
        const count = items.filter((item) => item !== '').length;
        if (album.videoCount !== count) set.videoCount = count;
    }
    if (Object.keys(set).length > 0) changes.push({ album, set });
}

for (const { album, set } of changes) {
    console.log(`${write ? 'UPDATE' : 'would update'} ${album.category}/${album.subCategory}/${album.collection}/${album.name}`, JSON.stringify(set));
    if (write) {
        const fields = Object.keys(set);
        await database.update({
            TableName: table,
            Key: { name: album.name, startDateTime: album.startDateTime },
            ConditionExpression: 'attribute_exists(#name)',
            UpdateExpression: 'SET ' + fields.map((f) => `#${f} = :${f}`).join(', '),
            ExpressionAttributeNames: { '#name': 'name', ...Object.fromEntries(fields.map((f) => [`#${f}`, f])) },
            ExpressionAttributeValues: Object.fromEntries(fields.map((f) => [`:${f}`, set[f]]))
        });
    }
}
console.log(`\n${changes.length} albums ${write ? 'updated' : 'would change'}`);

// Report on the state after the changes above.
const after = albums.map((album) => ({ ...album, ...(changes.find((c) => c.album === album)?.set || {}) }));
const production = after.filter((a) => a.production);
const list = (title, items) => {
    console.log(`\n${title}: ${items.length}`);
    for (const a of items) console.log(`  ${a.category}/${a.subCategory}/${a.collection}/${a.name}`);
};
list('Production albums with no summary', production.filter((a) => !a.summary));
list('Production albums with no coverAlt', production.filter((a) => !a.coverAlt));
console.log(`\nTop ${top} production albums by viewCount (rewrite these first)`);
production.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, top).forEach((a, i) => {
    const missing = ['summary', 'coverAlt', 'locationLabel'].filter((f) => !a[f]);
    console.log(`  ${i + 1}. ${a.category}/${a.subCategory}/${a.collection}/${a.name}  views=${a.viewCount || 0}  missing: ${missing.join(', ') || 'none'}`);
});
