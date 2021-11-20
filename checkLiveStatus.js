const mongoQuery = require('./mongoquery');
const config = require('./config/config');
const rp = require('request-promise');

const checkLiveDomains = async () => {
    let totalUrls = await mongoQuery.countUrlDocuments();

    let limit = totalUrls > 50 ? 50 : totalUrls;
    let numberOfPage = parseInt(totalUrls / 50);
    let i = 0;
    do {
        let Url50 = await mongoQuery.findDocuments(i, limit);
        let arrStatusResponse = Url50.map((val) => isDomainLive(val.url));
        let arrStatus = await Promise.all(arrStatusResponse);

        //save url status to mongodb
        await mongoQuery.saveToMongoDatabase(arrStatus, limit);
        i++;
    } while (i < numberOfPage);

    myVar = setTimeout(checkLiveDomains, config.waitingTimeAfterAllUrlCheck);
}

//function to check the connection status of url
const isDomainLive = url => rp({
    uri: url,
    timeout: config.waitingTimeForCheckingOneUrl,
    resolveWithFullResponse: true
})
    .then(response => {
        return {
            url,
            status: response.statusCode.toString(),
            date: new Date().toISOString()
        };
    })
    .catch(error => {
        if (error.response && error.response.statusCode) {
            return {
                url,
                status: error.response.statusCode.toString(),
                date: new Date().toISOString()
            };
        } else {
            return {
                url,
                status: '000',
                date: new Date().toISOString()
            };
        }
    });

mongoQuery.connectMongoDb()
    .then(() => {
        checkLiveDomains();
    });
