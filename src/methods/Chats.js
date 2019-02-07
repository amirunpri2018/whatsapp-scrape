const { from } = require('rxjs');
const { scan, concatMap, takeWhile } = require('rxjs/operators');
const { sleep } = require('../utils/Utils');
const { getProperty, scrollTo, waitForFromElement } = require('../utils/Pages');

const todayTimeRegex = /^[0-2][0-9]:[0-5][0-9]$/;
const messageInRegex = /message-in/;

/**
 * @param {string} text
 */
const isToday = text => todayTimeRegex.test(text);

/**
 * @typedef {import('puppeteer').Page} Page
 * @typedef {import('puppeteer').ElementHandle} ElementHandle
 */

/**
 * @param {Page} page
 */
const waitForChat = async page => page.waitFor('div._2wP_Y');

/**
 * @typedef {object} Contact
 * @property {string} phone
 * @property {string} about
 */
/**
 * @param {Page} page
 * @returns {Promise<Contact>}
 */
const scrapeContact = async page => {
    const phoneElement = await page.$(
        'div._1CRb5._34vig > div._14oqx > div.DcItJ > div._3WCza > span.selectable-text.invisible-space.copyable-text > span._3LL06'
    );
    const aboutElement = await page.$(
        'div._1CRb5._34vig > div._14oqx._1mf1Y > div.DcItJ > div._3WCza > span._3LL06 > span.selectable-text.invisible-space.copyable-text'
    );
    return {
        phone: phoneElement && (await getProperty(phoneElement, 'textContent')),
        about: aboutElement && (await getProperty(aboutElement, 'innerHTML'))
    };
};

/**
 * @param {Page} page
 */
const autoScroll = async page => {
    const messagesScroll = await page.waitFor('div._2nmDZ');
    await page.evaluate(
        (p, y) => p.scrollBy(0, y),
        messagesScroll,
        -(await getProperty(messagesScroll, 'offsetHeight')) * 2
    );
    await sleep(2);
    const times = await messagesScroll.$$(
        'div.vW7d1._3rjxZ > div._3_7SH.Zq3Mc > span[dir="auto"], div.vW7d1._3rjxZ > div._3_7SH._14b5J.Zq3Mc > div[role="button"] > span > span[dir="ltr"]'
    );
    const progress = await page.$(
        'div._1MsrQ > div._3dGYA > svg._1UDDE > circle._3GbTq.Qf313'
    );
    return (times.length >= 2 && progress === null) || autoScroll(page);
};

/**
 * @typedef {object} Message
 * @property {"in" | "out"} type
 * @property {string} text
 * @property {string} imageUri
 */
/**
 * @typedef {object} ElementAndClassName
 * @property {ElementHandle} element
 * @property {string} className
 */
/**
 * @param {ElementHandle} element
 * @returns {ElementAndClassName}
 */
const mapElementToElementAndClassName = async element => ({
    element,
    className: await getProperty(element, 'className')
});

/**
 * @param {ElementAndClassName} param
 * @returns {Message}
 */
const mapElementAndClassNameToMessage = async ({ element, className }) => {
    const txtElement = await element.$('div._3zb-j.ZhF0n > span');
    const imgElement = await element.$('div._3v3PK > img._1JVSX');
    /** @type {string} */
    const imgSrc = imgElement && (await getProperty(imgElement, 'src'));
    return {
        type: messageInRegex.test(className) ? 'in' : 'out',
        text: txtElement && (await getProperty(txtElement, 'textContent')),
        imageUri: imgSrc && imgSrc.slice(5)
    };
};

/**
 * @param {Page} page
 * @returns {Message[]}
 */
const scrapAllMessages = async page => {
    await autoScroll(page);
    const elements = await page.$$(
        'div.vW7d1 > div._3_7SH._3DFk6, div.vW7d1 > div._3_7SH._3qMSo, div.vW7d1._3rjxZ > div._3_7SH.Zq3Mc > span'
    );
    return from(elements.reverse())
        .pipe(
            concatMap(mapElementToElementAndClassName),
            takeWhile(({ className }) => className !== ''),
            concatMap(mapElementAndClassNameToMessage),
            scan((acc, v) => [...acc, v], [])
        )
        .toPromise();
};

/**
 * @typedef {object} Chat
 * @property {string} name
 * @property {string} phone
 * @property {string} about
 * @property {Message[]} messages
 */
/**
 * @typedef {object} Acc
 * @property {ElementHandle} parent
 * @property {ElementHandle[]} currentChats
 * @property {number} currentHeight
 * @property {boolean} reachBottom
 * @property {Chat[]} allChats
 * @property {string[]} names
 */

/**
 * @param {Page} page
 * @returns {Promise<Acc>}
 */
const createInitialAcc = async page => ({
    parent: await page.$('div#pane-side'),
    currentChats: await page.$$('div._2wP_Y'),
    currentHeight: 0,
    reachBottom: false,
    allChats: [],
    names: []
});

/**
 * @param {ElementHandle} chat
 */
const showMessages = async chat => {
    (await waitForFromElement(chat, 'div[tabindex="-1"]')).click();
    await sleep(2);
};

/**
 * @param {Page} page
 * @returns {Promise<void>}
 */
const showContactDetail = async page => {
    (await page.waitFor('div._1WBXd')).click();
    await page.waitFor('div._1CRb5._34vig');
    await page.waitFor('div._3dGYA[title="loading messages"]', {
        hidden: true
    });
    await sleep(2);
};

/**
 * @param {ElementHandle} parent
 * @param {number} currentHeight
 * @param {number} nextHeight
 * @returns {Promise<boolean>}
 */
const isShouldScroll = async (parent, nextHeight) => {
    /** @type {number} */
    const parentScrollHeight = await getProperty(parent, 'scrollHeight');
    /** @type {number} */
    const parentOffsetHeight = await getProperty(parent, 'offsetHeight');
    return parentScrollHeight > nextHeight + parentOffsetHeight;
};

/**
 * @param {ElementHandle} parent
 * @param {ElementHandle} chat
 * @param {number} chatHeight
 * @returns {Promise<boolean>}
 */
const isInValidPosition = async (parent, chat, chatHeight) => {
    const parentTopPixel = (await parent.boundingBox()).y;
    const chatTopPixel = (await chat.boundingBox()).y;
    return (
        parentTopPixel - chatTopPixel < 0 ||
        parentTopPixel - chatTopPixel > chatHeight
    );
};

/**
 * @param {Page} page
 * @param {Promise<Acc>} acc
 * @returns {Promise<Chat[]>}
 */
const scrapeChats = async (page, acc) => {
    const accumulator = acc ? await acc : await createInitialAcc(page);
    const {
        parent,
        currentChats,
        allChats,
        currentHeight,
        reachBottom,
        names
    } = accumulator;
    if (currentChats.length === 0) {
        return allChats;
    }
    const chat = currentChats.pop();
    const name = await getProperty(
        await chat.$('span._1wjpf:not(._3NFp9)'),
        'title'
    );

    if (names.indexOf(name) >= 0) {
        return scrapeChats(page, Promise.resolve(accumulator));
    }

    /** @type {number} */
    const chatHeight = await getProperty(chat, 'offsetHeight');
    if (!reachBottom && (await isInValidPosition(parent, chat, chatHeight))) {
        return scrapeChats(page, Promise.resolve(accumulator));
    }
    const timeElement = await chat.$(
        'div._2EXPL > div._3j7s9 > div._2FBdJ > div._3Bxar > span._3T2VG'
    );
    /** @type {string} */
    const time = timeElement && (await getProperty(timeElement, 'textContent'));
    const unreadElement = await chat.$(
        'div._2EXPL > div._3j7s9 > div._1AwDx > div._3Bxar > span > div._15G96 > span.OUeyt'
    );

    names.push(name);
    if (unreadElement === null && isToday(time)) {
        await showMessages(chat);
        const messages = await scrapAllMessages(page);
        await showContactDetail(page);
        const { phone, about } = await scrapeContact(page);
        allChats.push({ name, time, about, phone, messages });
    } else {
        await sleep(2);
    }

    const nextHeight = currentHeight + chatHeight;
    const shouldScroll = await isShouldScroll(parent, nextHeight);
    if (shouldScroll) {
        await scrollTo(page, parent, 0, nextHeight);
    }

    return reachBottom && currentChats.length === 0
        ? allChats
        : scrapeChats(
              page,
              Promise.resolve({
                  parent,
                  currentChats: await page.$$('div._2wP_Y'),
                  currentHeight: nextHeight,
                  reachBottom: !shouldScroll,
                  allChats,
                  names
              })
          );
};

module.exports = { waitForChat, scrapeChats };
