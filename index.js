require('axios');
require('cheerio');
const puppeteer = require('puppeteer');
const { waitForChat, scrapeChats } = require('./src/methods/Chats');

const run = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath:
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        userDataDir: 'user'
    });

    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com', {
        waitUntil: 'load'
    });

    await waitForChat(page);
    const chats = await scrapeChats(page);
    console.log(JSON.stringify(chats, null, 2));
    console.log(`chats length: ${chats.length}`);
};

run();
