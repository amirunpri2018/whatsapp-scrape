const puppeteer = require('puppeteer');
const { userDataDir } = require('../../env');
const { waitForChat, scrapeChats } = require('../methods/Chats');
const service = require('../services/BreefAdminService');
const {
    isDeal,
    isContact,
    parseDeal,
    parseContact
} = require('../utils/Messages');

/** @type {import('../methods/Chats').ScrapeChatConfig} */
const defaultConfig = {
    chatsIncludeRegExp: /^[0-2][0-9]:[0-5][0-9]$/,
    messagesMaxRegExp: /^TODAY$/i
};

/**
 * @typedef {object} Messages
 * @property {import('../services/BreefAdminService').Deal[]} deals
 * @property {import('../services/BreefAdminService').Contact[]} contacts
 */
/**
 * @param {Messages} acc
 * @param {import('../methods/Chats').Chat} param
 */
const reducer = (acc, { messages }) =>
    messages.reduce((a, { text, type }) => {
        if (type === 'out') {
            if (isContact(text)) {
                a.contacts.push(parseContact(text));
            } else if (isDeal(text)) {
                a.deals.push(parseDeal(text));
            }
        }
        return a;
    }, acc);

const openPage = async () => {
    const browser = await puppeteer.launch({ headless: true, userDataDir });

    const page = (await browser.pages())[0] || (await browser.newPage());
    await page.goto('https://web.whatsapp.com', { waitUntil: 'load' });
    return page;
};

/** @param {import('../methods/Chats').ScrapeChatConfig} config */
const scrape = async (config = defaultConfig) => {
    try {
        // eslint-disable-next-line no-console
        console.log('Prepare page');
        const page = await openPage();

        await waitForChat(page);
        // eslint-disable-next-line no-console
        console.log('Scrapping ...');
        const chats = await scrapeChats(page, config);
        /** @type {Messages} */
        const { deals, contacts } = chats.reduce(reducer, {
            deals: [],
            contacts: []
        });
        await page.browser().close();
        // eslint-disable-next-line no-console
        console.log('Send too breef admin');
        await service.postContacts(contacts);
        await service.postDeals(deals);
        // eslint-disable-next-line no-console
        console.log(
            `Scrapping success\n, deals: ${JSON.stringify(
                deals,
                null,
                2
            )}\ncontacts: ${JSON.stringify(contacts, null, 2)}`
        );
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Srapping failed');
        // eslint-disable-next-line no-console
        console.log(err);
    }
};

/**
 * @typedef {object} Query
 * @property {string} chatsIncludeRegExp
 * @property {string} messagesMaxRegExp
 */
/**
 * @type {import('fastify').RequestHandler<any, any, Query>}
 */
const scrapeHandler = async ({
    query: { chatsIncludeRegExp, messagesMaxRegExp }
}) => {
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
    scrape(config);
    return 'Scrapping is started ...';
};

/**
 * @type {import('fastify').RouteOptions<any, any, any, Query>}
 */
const scrapeRoute = {
    method: 'GET',
    url: '/',
    schema: {
        querystring: {
            chatsIncludeRegExp: { type: 'string' },
            messagesMaxRegExp: { type: 'string' }
        },
        response: {
            200: { type: 'string' }
        }
    },
    handler: scrapeHandler
};

module.exports = { scrape, scrapeRoute };
