require('axios');
require('cheerio');
const puppeteer = require('puppeteer');
const scheduler = require('node-schedule');
const { waitForChat, scrapeChats } = require('./src/methods/Chats');
const { chromeExecutablePath, userDataDir } = require('./env');
const {
    isDeal,
    isContact,
    parseDeal,
    parseContact
} = require('./src/utils/Messages');

const run = async () => {
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
    const chats = await scrapeChats(page);
    console.log(`chats: ${JSON.stringify(chats, null, 2)}`);
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
    console.log(`deals: ${JSON.stringify(parsedDeals, null, 2)}`);
    console.log(`contacts: ${JSON.stringify(parsedContacts, null, 2)}`);
    await browser.close();
};

const job = scheduler.scheduleJob('Scrap WhatsApp', '* * 23 * * *', run);
job.invoke();
