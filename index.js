const fastify = require('fastify');
require('axios');
require('cheerio');
const scheduler = require('node-schedule');
const { scrape, scrapeRoute } = require('./src/routes/Scrape');
const { port } = require('./env');

scheduler.scheduleJob('Scrap WhatsApp', '* * 23 * * *', () => scrape());

const server = fastify();

server.route(scrapeRoute);

server.listen(parseInt(port, 10), (err, address) => {
    if (err) {
        // eslint-disable-next-line no-console
        console.log(err);
    } else {
        // eslint-disable-next-line no-console
        console.log(`Server running at http://${address}/`);
    }
});
