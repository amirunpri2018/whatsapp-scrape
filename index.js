const fastify = require('fastify');
require('axios');
require('cheerio');
const { scrapeHandler, scrapeSchema } = require('./src/routes/Scrape');
const { port } = require('./env');

const server = fastify();
server.get('/start', { schema: scrapeSchema }, scrapeHandler);
server.listen(parseInt(port, 10), (err, address) => {
    if (err) {
        // eslint-disable-next-line no-console
        console.log(err);
    } else {
        // eslint-disable-next-line no-console
        console.log(`Server running at ${address}/`);
    }
});
