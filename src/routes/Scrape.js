const {
    waitForChat,
    scrapeChats,
    scrapeContacts
} = require('../methods/Chats');
const service = require('../services/BreefAdminService');
const { sendScrapeNotification } = require('../services/SlackService');
const { scrapeNotification } = require('../utils/Slacks');
const { isLead, parseLead } = require('../utils/Messages');
const { openPage } = require('../utils/Pages');

/** @type {import('../methods/Chats').ScrapeChatConfig} */
const defaultConfig = {
    chatsIncludeRegExp: /^[0-2][0-9]:[0-5][0-9]$/,
    messagesMaxRegExp: /^TODAY$/i
};

/** @param {import('../methods/Chats').ScrapeContactConfig} config */
const scrapeContactsFunction = async (config = defaultConfig) => {
    const startTime = new Date();
    try {
        // eslint-disable-next-line no-console
        console.log('Prepare page');
        const page = await openPage();

        await waitForChat(page);
        // eslint-disable-next-line no-console
        console.log('Scrapping ...');
        const chats = await scrapeContacts(page, config);
        await page.browser().close();
        // eslint-disable-next-line no-console
        console.log(
            `Scrapping success\n, contacts: ${JSON.stringify(chats, null, 2)}`
        );
        await sendScrapeNotification(
            scrapeNotification({
                title: 'WhatsApp Scraping Success',
                message: `${chats.length} chat(s) scrapped`,
                startTime,
                endTime: new Date()
            })
        );
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Srapping failed');
        // eslint-disable-next-line no-console
        console.log(err);
        await sendScrapeNotification(
            scrapeNotification({
                title: 'WhatsApp Scraping Failed',
                message: err.message,
                startTime,
                endTime: new Date()
            })
        );
    }
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

/** @param {import('../methods/Chats').ScrapeChatConfig} config */
const scrapeChatsFunction = async (config = defaultConfig) => {
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
        await sendScrapeNotification(
            scrapeNotification({
                title: 'WhatsApp Scraping Success',
                message: `${leads.length} lead(s) scrapped`,
                startTime,
                endTime: new Date()
            })
        );
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Srapping failed');
        // eslint-disable-next-line no-console
        console.log(err);
        await sendScrapeNotification(
            scrapeNotification({
                title: 'WhatsApp Scraping Failed',
                message: err.message,
                startTime,
                endTime: new Date()
            })
        );
    }
};

let scrapping = false;

/**
 * @typedef {object} ChatsQuery
 * @property {string} chatsIncludeRegExp
 * @property {string} messagesMaxRegExp
 */
/**
 * @type {import('fastify').RequestHandler<any, any, ChatsQuery>}
 */
const scrapeChatsHandler = async ({
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
    if (scrapping) {
        return 'Another scrapping process is running';
    }
    (async () => {
        scrapping = true;
        try {
            await scrapeChatsFunction(config);
        } finally {
            scrapping = false;
        }
    })();
    return 'Scrapping is started ...';
};

/** @type {import('fastify').RouteSchema} */
const scrapeChatsSchema = {
    querystring: {
        chatsIncludeRegExp: { type: 'string' },
        messagesMaxRegExp: { type: 'string' }
    },
    response: {
        200: { type: 'string' }
    }
};

/**
 * @typedef {object} ContactsQuery
 * @property {string} filter
 */
/**
 * @type {import('fastify').RequestHandler<any, any, ContactsQuery>}
 */
const scrapeContactsHandler = async ({ query: { filter } }) => {
    const config =
        filter && filter.length > 0
            ? {
                  chatsIncludeRegExp: new RegExp(filter, 'i')
              }
            : undefined;
    if (scrapping) {
        return 'Another scrapping process is running';
    }
    (async () => {
        scrapping = true;
        try {
            await scrapeContactsFunction(config);
        } finally {
            scrapping = false;
        }
    })();
    return 'Scrapping is started ...';
};

/** @type {import('fastify').RouteSchema} */
const scrapeContactsSchema = {
    querystring: {
        filter: { type: 'string' }
    },
    response: {
        200: { type: 'string' }
    }
};

module.exports = {
    scrapeChatsFunction,
    scrapeContactsFunction,
    scrapeChatsSchema,
    scrapeContactsSchema,
    scrapeChatsHandler,
    scrapeContactsHandler
};
