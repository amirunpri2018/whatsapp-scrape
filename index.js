const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');


const sleep = seconds => {
    return new Promise ((resolve) => {
        setTimeout(resolve, seconds * 1000 );
    })
};

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
        chats = await page.$$('._2wP_Y');
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

const getData = async (page, element) => {
    const title = await element.$('._1wjpf');
    console.log(await page.evaluate(element => element.textContent, title));
    // const chatBubbles = await page.$$('span.selectable-text.invisible-space.copyable-text');

    const chatBubbles = await page.$$('.vW7d1:not(._3rjxZ)');
    await asyncForEach(chatBubbles, async (bubble) => {
        // console.log(await page.evaluate(element => element.textContent, bubble));

        if (await bubble.$('div.message-in') !== null) {
            console.log('C: ' + await page.evaluate(element => element.textContent, await bubble.$('span.selectable-text.invisible-space.copyable-text')));
        } else {
            console.log('B: ' + await page.evaluate(element => element.textContent, await bubble.$('span.selectable-text.invisible-space.copyable-text')));
        }
    });
};

const autoScroll = async (page, waitingElementClass) => {
    let cont = true;
    while (cont) {
        await page.evaluate(document => {
            document.querySelector('._2nmDZ').scrollBy(0, -1000);
        }, await page.$('body'));
        await sleep(2);
        if (await page.$('.' + waitingElementClass) === null) {
            cont = false;
        }
    }

};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
};

run();
