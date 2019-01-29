const { sleep } = require('../utils/Utils');
const { getProperty } = require('../utils/Pages');

/**
 * @typedef {import('puppeteer').Page} Page
 * @typedef {import('puppeteer').ElementHandle} ElementHandle
 */

/**
 * @param {Page} page
 */
const waitForChat = async page => page.waitForSelector('div._2wP_Y');

/**
 * @param {ElementHandle} element
 * @param {string} selector
 * @returns {Promise<ElementHandle>}
 */
const waitForChild = async (element, selector) =>
    (await element.$(selector)) || waitForChild(element, selector);

/**
 * @param {ElementHandle} element
 * @param {string} selector
 * @param {number} timer
 * @returns {Promise<void>}
 */
const waitForChildToGoAway = async (element, selector, timer = 2) => {
    await sleep(timer);
    const child = await element.$(selector);
    return child ? waitForChildToGoAway(element, selector, timer) : undefined;
};

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
 * @typedef {object} Chat
 * @property {string} name
 * @property {string} phone
 * @property {string} about
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
 * @param {Page} page
 * @param {ElementHandle} chat
 * @returns {Promise<void>}
 */
const showContactDetail = async (page, chat) => {
    (await waitForChild(chat, 'div[tabindex="-1"]')).click();
    await sleep(2);
    (await page.waitForSelector('div._1WBXd')).click();
    await page.waitForSelector('div._1CRb5._34vig');
    await waitForChildToGoAway(page, 'div._3dGYA[title="loading messages"]');
    await sleep(2);
};

/**
 * @param {Page} page
 * @param {ElementHandle} element
 * @param {number} x
 * @param {number} y
 */
const scrollTo = async (page, element, x, y) =>
    page.evaluate((p, a, b) => p.scrollTo(a, b), element, x, y);

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
const isInValidosition = async (parent, chat, chatHeight) => {
    const parentTopPixel = (await parent.boundingBox()).y;
    const chatTopPixel = (await chat.boundingBox()).y;
    return (
        parentTopPixel - chatTopPixel < 0 ||
        parentTopPixel - chatTopPixel > chatHeight
    );
};

/**
 * @param {Promise<Acc>} acc
 * @param {Page} page
 * @returns {Promise<Chat[]>}
 */
const scrapeChats = async (acc, page) => {
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
    const chatName = await getProperty(
        await chat.$('span._1wjpf:not(._3NFp9)'),
        'title'
    );

    if (names.indexOf(chatName) > 1) {
        return scrapeChats(Promise.resolve(accumulator), page);
    }

    const chatHeight = await getProperty(chat, 'offsetHeight');
    if (!reachBottom && (await isInValidosition(parent, chat, chatHeight))) {
        return scrapeChats(Promise.resolve(accumulator), page);
    }

    names.push(chatName);
    await showContactDetail(page, chat);
    const { phone, about } = await scrapeContact(page);
    allChats.push({ name: chatName, about, phone });

    const nextHeight = currentHeight + chatHeight;
    const shouldScroll = await isShouldScroll(parent, nextHeight);
    if (shouldScroll) {
        await scrollTo(page, parent, 0, nextHeight);
    }

    return reachBottom && currentChats.length === 0
        ? allChats
        : scrapeChats(
              Promise.resolve({
                  parent,
                  currentChats: await page.$$('div._2wP_Y'),
                  currentHeight: nextHeight,
                  reachBottom: !shouldScroll,
                  allChats,
                  names
              }),
              page
          );
};

module.exports = { waitForChat, scrapeChats };
