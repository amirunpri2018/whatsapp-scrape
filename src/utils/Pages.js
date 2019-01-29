const { sleep } = require('./Utils');

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
 * @param {ElementHandle} element
 * @param {string} name
 * @returns {Promise<T>}
 * @template T
 */
const getProperty = async (element, name) =>
    (await element.getProperty(name)).jsonValue();

module.exports = { autoScroll, getProperty };
