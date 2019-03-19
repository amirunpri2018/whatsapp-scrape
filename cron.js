require('axios');
require('cheerio');
const { scrapeChatsFunction } = require('./src/routes/Scrape');

(async () => {
    try {
        await scrapeChatsFunction();
        process.exit();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        process.exit(1);
    }
})();
