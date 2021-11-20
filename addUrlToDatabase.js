const path = require('path');
const fs = require('fs');

const LiveDomain = require('./models/livedomain');
const mongoQuery = require('./mongoquery');


//save url to mongodb
const addUrlToDatabase = async (filepath) => {
    await mongoQuery.connectMongoDb();
    fs.readFile(filepath, async function (err, data) {

        if (err) {
            throw err;
        }
        let urlArr = data.toString().split("\n");
        mongoQuery.addUrlToDatabase(urlArr);
    });
};

addUrlToDatabase(path.join(__dirname, 'public', 'domainList.txt'));