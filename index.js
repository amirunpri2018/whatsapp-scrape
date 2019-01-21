const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { asyncForEach } = require('./src/utils/Array');
const { autoScroll } = require('./src/utils/Pages');
const { sleep } = require('./src/utils/Utils');
const { parseMessageList } = require('./src/methods/Messages');

const run = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        userDataDir: 'user'
    });

    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com', {
        waitUntil: 'load'
    });
    
    setTimeout(async () => {
        const chats = await page.$$('._2wP_Y');
        chats[chats.length] = chats[0];
        chats.shift();
        chats.reverse();
        
        console.log(chats.length);

        await asyncForEach(chats, async (element) => {
            await element.click();
            await sleep(2);
            await autoScroll(page, '_3dGYA');
            await sleep(3);
            await getData(page, element);
        });
    }, 20000);

    // await browser.close();
};

/**
 * @param {import('puppeteer').Page} page
 * @param {import('puppeteer').ElementHandle} element
 */
const getData = async (page, element) => {
    const title = await element.$('._1wjpf');
    console.log(await page.evaluate(element => element.textContent, title));
    // const chatBubbles = await page.$$('span.selectable-text.invisible-space.copyable-text');

    const messages = await parseMessageList(page);

    messages.forEach(({ incoming, text }) => {
        console.log(`${incoming ? 'B' : 'C'}: ${text}`);
    });
};

run();
