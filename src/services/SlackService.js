const axios = require('axios');
const { slackWebhook } = require('../../env');

/**
 * @typedef {object} Field
 * @property {string} title
 * @property {string} value
 * @property {boolean} short
 */
/**
 * @typedef {object} Attachment
 * @property {string} fallback
 * @property {string} title
 * @property {string} text
 * @property {string} color
 * @property {Field[]} fields
 * @property {string} footer
 * @property {number} ts timestamp in seconds
 */
/**
 * @typedef {object} FailedScrapeNotification
 * @property {string} text
 * @property {Attachment[]} attachments
 */

/**
 * @param {FailedScrapeNotification} data
 */
const sendFailedScrapeNotification = data =>
    axios.default.post(slackWebhook, data);

module.exports = { sendFailedScrapeNotification };
