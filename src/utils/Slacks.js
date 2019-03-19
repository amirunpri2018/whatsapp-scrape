/**
 * @typedef {object} Param
 * @property {string} title
 * @property {string} message
 * @property {Date} startTime
 * @property {Date} endTime
 */

const tokens = {
    date: '{date}',
    dateShort: '{date_short}',
    time: '{time}'
};

/**
 * @param {Date} date
 * @param {string} text
 * @param {string} fallback
 */
const createDateString = (date, text, fallback) =>
    `<!date^${Math.round(date.getTime() / 1000)}^${text}|${fallback ||
        'Invalid'}>`;

/**
 * @param {Param} param
 * @returns {import('../services/SlackService').ScrapeNotification}
 */
const scrapeNotification = ({ title, message, startTime, endTime }) => ({
    text: title,
    attachments: [
        {
            fallback: 'Message',
            title: 'Message',
            text: message,
            color: '#548fe4',
            fields: [
                {
                    title: 'Start Date',
                    value: createDateString(startTime, tokens.dateShort),
                    short: true
                },
                {
                    title: 'Start Time',
                    value: createDateString(startTime, tokens.time),
                    short: true
                },
                {
                    title: 'End Date',
                    value: createDateString(endTime, tokens.dateShort),
                    short: true
                },
                {
                    title: 'End Time',
                    value: createDateString(endTime, tokens.time),
                    short: true
                },
                {
                    title: 'Priority',
                    value: 'High',
                    short: true
                }
            ],
            footer: 'WhatsApp Scrape',
            ts: endTime.getTime() / 1000
        }
    ]
});

module.exports = { scrapeNotification, createDateString, tokens };
