'use strict';

/**
 * @typedef {import('puppeteer').Page} Page
 * @typedef {import('puppeteer').ElementHandle} ElementHandle
 * @typedef {object} Message
 * @property {boolean} incoming
 * @property {string} text
 */

/**
 * @param {Page} page
 * @param {ElementHandle} messageElement
 * @returns {Promise<Message>}
 */
const parseMessage = async (page, messageElement) => {
    const incoming = (await messageElement.$('div.message-in')) !== null;
    const text = await page.evaluate(
        element => element && element.textContent,
        await messageElement.$(
            'span.selectable-text.invisible-space.copyable-text'
        )
    );
    return { incoming, text };
};

/**
 * @param {Page} page
 */
const parseMessageList = async page => {
    const messageElements = await page.$$('.vW7d1:not(._3rjxZ)');
    return Promise.all(
        messageElements.map(element => parseMessage(page, element))
    );
};

module.exports = { parseMessage, parseMessageList };
