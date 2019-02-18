const fastify = require('fastify');
require('axios');
require('cheerio');
const { scrapeRoute } = require('./src/routes/Scrape');
const { basicAuth, basicAuthHook } = require('./src/routes/Auth');
const { port } = require('./env');

const server = fastify();
const basicAuthPlugin = basicAuth();
server.register(basicAuthPlugin.plugin, basicAuthPlugin.options).after(() => {
    const hook = basicAuthHook(server);
    server.addHook(hook.name, hook.middleware);
    server.route(scrapeRoute);
});
server.listen(parseInt(port, 10), (err, address) => {
    if (err) {
        // eslint-disable-next-line no-console
        console.log(err);
    } else {
        // eslint-disable-next-line no-console
        console.log(`Server running at ${address}/`);
    }
});
