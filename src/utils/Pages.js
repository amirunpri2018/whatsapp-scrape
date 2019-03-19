const puppeteer = require('puppeteer');
const { sleep } = require('./Utils');
const { headless, userDataDir } = require('../../env');

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

/**
 * @typedef {import('puppeteer').Page} Page
 * @typedef {import('puppeteer').ElementHandle} ElementHandle
 */

/**
 * @param {Page} page
 * @param {string} waitingElementClass
 */
const autoScroll = async (page, waitingElementClass) => {
    await page.evaluate(document => {
        document.querySelector('._2nmDZ').scrollBy(0, -1000);
    }, await page.$('body'));
    await sleep(2);
    return (
        (await page.$(`.${waitingElementClass}`)) === null ||
        autoScroll(page, waitingElementClass)
    );
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
 * @param {ElementHandle} element
 * @param {string} name
 * @returns {Promise<T>}
 * @template T
 */
const getProperty = async (element, name) =>
    (await element.getProperty(name)).jsonValue();

/**
 * @param {ElementHandle} element
 * @param {string} selector
 * @returns {Promise<ElementHandle>}
 */
const waitForFromElement = async (element, selector) =>
    (await element.$(selector)) || waitForFromElement(element, selector);

module.exports = {
    autoScroll,
    scrollTo,
    getProperty,
    waitForFromElement,
    openPage
};
