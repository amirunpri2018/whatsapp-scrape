/** @type {import('ava').TestInterface} */
const test = require('ava');
const {
    failedScrapeNotification,
    createDateString,
    tokens
} = require('./Slacks');

test('create Failed Scrape Notification', t => {
    const message = 'Error Happen';
    const startTime = new Date();
    const endTime = new Date();

    /** @type {import('../services/SlackService').FailedScrapeNotification} */
    const expected = {
        text: 'WhatsApp Scrapping Failed',
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
    };

    const actual = failedScrapeNotification({ message, startTime, endTime });
    t.deepEqual(actual, expected);
});
