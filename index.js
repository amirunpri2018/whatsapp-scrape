const http = require('http');
const url = require('url');
const querystring = require('querystring');
require('axios');
require('cheerio');
const puppeteer = require('puppeteer');
const scheduler = require('node-schedule');
const { waitForChat, scrapeChats } = require('./src/methods/Chats');
const service = require('./src/services/BreefAdminService');
const { chromeExecutablePath, userDataDir, hostname, port } = require('./env');
const {
    isDeal,
    isContact,
    parseDeal,
    parseContact
} = require('./src/utils/Messages');

/** @type {import('./src/methods/Chats').ScrapeChatConfig} */
const defaultConfig = {
    chatsIncludeRegExp: /^[0-2][0-9]:[0-5][0-9]$/,
    messagesMaxRegExp: /^TODAY$/i
};

/** @param {import('./src/methods/Chats').ScrapeChatConfig} config */
const run = async (config = defaultConfig) => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: chromeExecutablePath,
        userDataDir
    });

    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com', {
        waitUntil: 'load'
    });

    await waitForChat(page);
    const chats = await scrapeChats(page, config);
    /**
     * @typedef {object} Messages
     * @property {string[]} deals
     * @property {string[]} contacts
     */
    /** @type {Messages} */
    const { deals, contacts } = chats.reduce(
        (acc, chat) =>
            chat.messages.reduce((a, { text, type }) => {
                if (type === 'out') {
                    if (isContact(text)) {
                        a.contacts.push(text);
                    } else if (isDeal(text)) {
                        a.deals.push(text);
                    }
                }
                return a;
            }, acc),
        { deals: [], contacts: [] }
    );
    const parsedDeals = deals.map(parseDeal);
    const parsedContacts = contacts.map(parseContact);
    await browser.close();
    await service.postDeals(parsedDeals);
    await service.postContacts(parsedContacts);
};

scheduler.scheduleJob('Scrap WhatsApp', '* * 23 * * *', () => run());

const server = http.createServer(async (req, res) => {
    const { chatsIncludeRegExp, messagesMaxRegExp } = querystring.parse(
        url.parse(req.url).query
    );
    const config =
        chatsIncludeRegExp &&
        chatsIncludeRegExp.length > 0 &&
        messagesMaxRegExp &&
        messagesMaxRegExp.length > 0
            ? {
                  chatsIncludeRegExp: new RegExp(chatsIncludeRegExp, 'i'),
                  messagesMaxRegExp: new RegExp(messagesMaxRegExp, 'i')
              }
            : undefined;
    await run(config);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Scrapping is started ...');
});

server.listen(parseInt(port, 10), hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running at http://${hostname}:${port}/`);
});
