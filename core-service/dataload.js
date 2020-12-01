const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const db = require('./db');
const dotenv = require('dotenv');

dotenv.config();

let menus = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'menu.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        name: data.name,
        type: data.type,
        link: data.link,
        external: data.external.toUpperCase() === 'TRUE',
        icon: data.icon,
        condition: data.condition,
        active: data.active.toUpperCase() === 'TRUE',
        position: data.position,
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        //console.log(row);
        menus.push(row);
    })
    .on('end', async rowCount => {
        menus.sort((a,b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
        await loadData("menu", menus);
        await console.log(`Parsed ${rowCount} rows`);
    });

let countries = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'country.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => {
        //console.log(row);
        countries.push(row)
    })
    .on('end', async rowCount => {
        countries.sort((a, b) => a.code.localeCompare(b.code));
        await loadData("country", countries);
        await console.log(`Parsed ${rowCount} rows`);
    });

const loadData = async (collection, data) => {
    try {
        const database = await db.get();
        await db.deleteDocuments(database, collection, {});
        await db.insertDocuments(database, collection, data);
        const docs = await db.findDocuments(database, collection, {}, {"_id": 1});
        await console.log(docs);
    } catch (err) {
        console.error(err);
    }
}