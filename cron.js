require('axios');
require('cheerio');
const { scrape } = require('./src/routes/Scrape');

(async () => {
    try {
        await scrape();
        process.exit();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        process.exit(1);
    }
})();
