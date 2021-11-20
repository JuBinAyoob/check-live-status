const mongoose = require('mongoose');
const request = require('request');
const config = require('./config/config');


//Connecting to mongodb
const connectMongoDb = () => {
    return new Promise(function (resolve, reject) {
        mongoose.connect(config.mongodb)
        let db = mongoose.connection;
        db.once('open', function () {
            //console.log('Connected to MongoDb');
            resolve(db);
        });

        db.on('error', function (err) {
            //console.log('Error in connection... Error:'+err);
            reject(err);
        });
    });
};

const closeMongoDbConnection = (db) => {
    return db.close();
};

//Bring in models
let LiveDomain = require('./models/livedomain');

function countUrlDocuments() {
    return LiveDomain.countDocuments({});
}

async function saveToMongoDatabase(arrStatus, limit) {
    let liveDomain = LiveDomain.collection.initializeUnorderedBulkOp();
    let arrChangedStatusCol = [];
    for (let i = 0; i < limit; i++) {
        let objCurStatus = await LiveDomain.findOne({ url: arrStatus[i].url }, { curstatus: 1 });

        let preStatus = '';
        if (objCurStatus.curstatus) {
            preStatus = objCurStatus.curstatus;
        }

        await liveDomain.find({ url: arrStatus[i].url }).update(
            {
                $set: {
                    prestatus: preStatus,
                    curstatus: arrStatus[i].status,
                    timestamp: arrStatus[i].date
                }
            }
        );

        if (preStatus != arrStatus[i].status) {
            let objLiveDomain = {};
            objLiveDomain.url = arrStatus[i].url;
            objLiveDomain.prestatus = preStatus;
            objLiveDomain.curstatus = arrStatus[i].status;
            objLiveDomain.timestamp = arrStatus[i].date;

            arrChangedStatusCol.push(objLiveDomain);
        }
    }

    try {
        await liveDomain.execute();

        if (arrChangedStatusCol.length > 0) {
            await mailChangedStatus(arrChangedStatusCol);
        } else {
            console.log("No changed status");
        }

    } catch (error) {
        console.log(error);
        console.log({ msg: 'failure' });
    }
}

const mailChangedStatus = (arrChangedStatusCol) => {

    let strMessage = '', strSubjuct = 'Changed domain live status table';


    strMessage = '<center><h2>Domain changed Live Status Table<h2>';
    strMessage += "<table style='width:80%; border:1px solid black; text-align: center;'>";
    strMessage += "<tr> <th> Url </th>  <th>Previous Status</th>  <th>Current Status</th> <th>timestamp<th/> </tr>"

    strMessage += arrChangedStatusCol.reduce((message, curVal) => message + "<tr><td>" + curVal.url + "</td> <td>" + curVal.prestatus + "</td> <td>" + curVal.curstatus + "</td> <td>" + curVal.timestamp + "</td> </tr>", '');

    strMessage += "</table></center>";

    console.log("domain status message:",strMessage);

    return request({
        uri: 'https://api.postmarkapp.com/email',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': config.MAILER_SERVER_TOKEN
        },
        body: JSON.stringify({From: config.MAILER_SENDER_EMAIL, To: config.MAILER_RECEIVER_EMAIL, Subject: strSubjuct, HtmlBody: strMessage})
      });
}

function findDocuments(skip, limit) {
    return LiveDomain.find({}, { url: 1 }).skip(skip).limit(limit);;
}

async function addUrlToDatabase(urlArr) {
    let liveDomainBulk = LiveDomain.collection.initializeUnorderedBulkOp();
    let totalUrls = urlArr.length, i = 0, findNew = false;
    while (i < totalUrls) {
        let urlData = urlArr[i];
        let data = await LiveDomain.findOne({ url: urlData });
        if (data == null) {
            findNew = true;
            await liveDomainBulk.insert({ url: urlArr[i] });
        }
        i++;
    }

    try {
        if (findNew) {
            await liveDomainBulk.execute();
            console.log({ msg: 'success' });
        } else {
            console.log({ msg: 'no new url found' });
        }
    } catch (error) {
        console.log(error);
        console.log({ msg: 'failure' });
    }
}

module.exports = {
    connectMongoDb, closeMongoDbConnection, countUrlDocuments, findDocuments, saveToMongoDatabase, addUrlToDatabase
};