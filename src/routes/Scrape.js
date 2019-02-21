const puppeteer = require('puppeteer');
const { userDataDir } = require('../../env');
const { waitForChat, scrapeChats } = require('../methods/Chats');
const service = require('../services/BreefAdminService');
const { sendFailedScrapeNotification } = require('../services/SlackService');
const { isLead, parseLead } = require('../utils/Messages');
const { headless } = require('../../env');

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
 * @param {import('../services/BreefAdminService').Lead[]} acc
 * @param {import('../methods/Chats').Chat} param
 */
const reducer = (acc, { phone, messages }) =>
    messages.reduce((a, { text, type }) => {
        if (type === 'out' && isLead(text)) {
            a.push({ ...parseLead(text), phone });
        }
        return a;
    }, acc);

const openPage = async () => {
    const browser = await puppeteer.launch({
        headless: headless === 'true',
        userDataDir,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = (await browser.pages())[0] || (await browser.newPage());
    await page.goto('https://web.whatsapp.com', { waitUntil: 'load' });
    return page;
};

/** @param {import('../methods/Chats').ScrapeChatConfig} config */
const scrape = async (config = defaultConfig) => {
    const startTime = new Date();
    try {
        // eslint-disable-next-line no-console
        console.log('Prepare page');
        const page = await openPage();

        await waitForChat(page);
        // eslint-disable-next-line no-console
        console.log('Scrapping ...');
        const chats = await scrapeChats(page, config);
        const leads = chats.reduce(reducer, []);
        await page.browser().close();
        // eslint-disable-next-line no-console
        console.log('Send too breef admin');
        await service.postLeads(leads);
        // eslint-disable-next-line no-console
        console.log(
            `Scrapping success\n, contacts: ${JSON.stringify(leads, null, 2)}`
        );
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Srapping failed');
        // eslint-disable-next-line no-console
        console.log(err);
        const endTime = new Date();
        await sendFailedScrapeNotification({
            message: err.message,
            startTime,
            endTime
        });
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
