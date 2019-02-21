const axios = require('axios');
const { slackWebhook } = require('../../env');

/**
 * @typedef {object} FailedScrapeNotification
 * @property {string} message
 * @property {Date} startTime
 * @property {Date} endTime
 */

/**
 * @param {FailedScrapeNotification} param
 */
const sendFailedScrapeNotification = ({ message, startTime, endTime }) =>
    axios.default.post(slackWebhook, {
        text: 'WhatsApp Scrapping Failed',
        attachments: [
            {
                fallback: 'Message',
                title: 'Message',
                text: message,
                color: '#548fe4',
                fields: [
                    {
                        title: 'Priority',
                        value: 'High',
                        short: false
                    },
                    {
                        title: 'Start',
                        value: startTime.toString()
                    },
                    {
                        title: 'End',
                        value: endTime.toString()
                    }
                ],
                footer: 'WhatsApp Scrape',
                ts: endTime.getTime() / 1000
            }
        ]
    });

module.exports = { sendFailedScrapeNotification };
