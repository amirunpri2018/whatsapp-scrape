'use strict';

const { sleep } = require('./Utils');

/**
 * @typedef {import('puppeteer').Page} Page
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
    return await page.$(`.${waitingElementClass}`) === null || autoScroll(page, waitingElementClass);
};

module.exports = { autoScroll }
