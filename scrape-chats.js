require('axios');
require('cheerio');
const { scrapeContactsFunction } = require('./src/routes/Scrape');

(async () => {
    try {
        const argv = process.argv.slice(2);
        await scrapeContactsFunction({
            chatsIncludeRegExp: new RegExp(argv.join('|'), 'i')
        });
        process.exit();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        process.exit(1);
    }
})();
