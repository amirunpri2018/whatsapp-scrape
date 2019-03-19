const { from } = require('rxjs');
const { scan, concatMap, takeWhile, filter } = require('rxjs/operators');
const { sleep } = require('../utils/Utils');
const { getProperty, scrollTo, waitForFromElement } = require('../utils/Pages');

const messageInRegex = /message-in/;

/**
 * @typedef {import('puppeteer').Page} Page
 * @typedef {import('puppeteer').ElementHandle} ElementHandle
 */

/** @param {Page} page */
const waitForChat = async page =>
    page.waitFor('div._2wP_Y', { timeout: 60000 });

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
 * @param {RegExp} maxRegExp
 */
const autoScroll = async (page, maxRegExp) => {
    const messagesScroll = await page.waitFor('div._2nmDZ', { timeout: 60000 });
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
    /** @type {string[]} */
    const timesText = await times.reduce(
        async (acc, v) => [...(await acc), await getProperty(v, 'textContent')],
        []
    );
    return (
        (timesText.length >= 2 &&
            timesText.findIndex(t => maxRegExp.test(t)) >= 0 &&
            progress === null) ||
        autoScroll(page, maxRegExp)
    );
};

/**
 * @typedef {object} Message
 * @property {"in" | "out"} type
 * @property {string} text
 * @property {string} imageUri
 * @property {string} time
 */
/**
 * @typedef {object} ElementAndClassName
 * @property {ElementHandle} element
 * @property {boolean} isTime
 * @property {string} time
 * @property {string} className
 */
/**
 * @param {ElementHandle} element
 * @returns {ElementAndClassName}
 */
const mapElementToElementAndClassName = async element => {
    const className = await getProperty(element, 'className');
    const isTime = className === '';
    return {
        element,
        isTime,
        time: isTime ? await getProperty(element, 'textContent') : null,
        className
    };
};

/**
 * @param {ElementAndClassName} param
 * @returns {Message}
 */
const mapElementAndClassNameToMessage = async ({
    element,
    className,
    time
}) => {
    const txtElement = await element.$('div._3zb-j.ZhF0n > span');
    const imgElement = await element.$('div._3v3PK > img._1JVSX');
    /** @type {string} */
    const imgSrc = imgElement && (await getProperty(imgElement, 'src'));
    const text = txtElement && (await getProperty(txtElement, 'textContent'));
    return {
        type: messageInRegex.test(className) ? 'in' : 'out',
        text,
        imageUri: imgSrc && imgSrc.slice(5),
        time
    };
};

/**
 * @param {Page} page
 * @param {RegExp} maxRegExp
 * @returns {Message[]}
 */
const scrapAllMessages = async (page, maxRegExp) => {
    await autoScroll(page, maxRegExp);
    const elements = await page.$$(
        'div.vW7d1 > div._3_7SH._3DFk6, div.vW7d1 > div._3_7SH._3qMSo, div.vW7d1._3rjxZ > div._3_7SH.Zq3Mc > span[dir="auto"]'
    );
    return from(elements.reverse())
        .pipe(
            concatMap(mapElementToElementAndClassName),
            takeWhile(({ isTime, time }) => !isTime && !maxRegExp.test(time)),
            filter(({ isTime }) => !isTime),
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
 * @property {T[]} allChats
 * @property {string[]} names
 * @template T
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
    (await page.waitFor('div._3mKlI')).click();
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
 * @param {ElementHandle} chat
 */
const scrapeTimeAndUnreadStatus = async chat => {
    const timeElement = await chat.$(
        'div._2EXPL > div._3j7s9 > div._2FBdJ > div._3Bxar > span._3T2VG'
    );
    /** @type {string} */
    const time = timeElement && (await getProperty(timeElement, 'textContent'));
    const unreadElement = await chat.$(
        'div._2EXPL > div._3j7s9 > div._1AwDx > div._3Bxar > span > div._15G96 > span.OUeyt'
    );
    return {
        time,
        unread: unreadElement !== null
    };
};

/**
 * @typedef {object} CurrentElement
 * @property {Chat[]} result
 * @property {string} name
 * @property {boolean} unread
 * @property {string} time
 * @property {ElementHandle} chat
 * @property {number} chatHeight
 */
/**
 * @param {Acc} accumulator
 * @param {RegExp} chatsIncludeRegExp
 * @returns {CurrentElement}
 */
const getCurrentElement = async (accumulator, chatsIncludeRegExp) => {
    const { parent, currentChats, allChats, reachBottom, names } = accumulator;
    if (currentChats.length === 0) {
        return { result: allChats };
    }
    const chat = currentChats.pop();
    /** @type {string} */
    const name = await getProperty(
        await chat.$('span._1wjpf:not(._3NFp9)'),
        'title'
    );

    if (names.indexOf(name) >= 0) {
        return getCurrentElement(accumulator, chatsIncludeRegExp);
    }

    /** @type {number} */
    const chatHeight = await getProperty(chat, 'offsetHeight');
    if (!reachBottom && (await isInValidPosition(parent, chat, chatHeight))) {
        return getCurrentElement(accumulator, chatsIncludeRegExp);
    }

    const { unread, time } = await scrapeTimeAndUnreadStatus(chat);
    if (!chatsIncludeRegExp.test(time)) {
        return { result: allChats };
    }
    return { unread, time, name, chat, chatHeight };
};

/**
 * @param {ElementHandle} page
 * @param {Acc} accumulator
 * @param {CurrentElement} current
 */
const prepareNextAcc = async (page, accumulator, current) => {
    const { chatHeight } = current;
    const { parent, allChats, currentHeight, names } = accumulator;

    const nextHeight = currentHeight + chatHeight;
    const shouldScroll = await isShouldScroll(parent, nextHeight);
    if (shouldScroll) {
        await scrollTo(page, parent, 0, nextHeight);
    }

    return {
        parent,
        currentChats: await page.$$('div._2wP_Y'),
        currentHeight: nextHeight,
        reachBottom: !shouldScroll,
        allChats,
        names
    };
};

/**
 * @typedef {object} ScrapeContactConfig
 * @property {RegExp} chatsIncludeRegExp
 */
/**
 * @param {Page} page
 * @param {ScrapeContactConfig} config
 * @returns {Promise<{ name: string }[]>}
 */
const scrapeContacts = async (page, { chatsIncludeRegExp }) => {
    /**
     * @param {Acc<{ name: string }>} accumulator
     */
    const scrape = async accumulator => {
        const current = await getCurrentElement(
            accumulator,
            chatsIncludeRegExp
        );
        if (current.result) {
            return current.result;
        }
        const { name } = current;
        const { allChats, names, reachBottom, currentChats } = accumulator;
        names.push(name);
        // eslint-disable-next-line no-console
        console.log(`scrape: ${name}`);
        allChats.push({ name });
        return reachBottom && currentChats.length === 0
            ? allChats
            : scrape(await prepareNextAcc(page, accumulator, current));
    };
    return scrape(await createInitialAcc(page));
};

/**
 * @typedef {object} ScrapeChatConfig
 * @property {RegExp} chatsIncludeRegExp
 * @property {RegExp} messagesMaxRegExp
 */
/**
 * @param {Page} page
 * @param {ScrapeChatConfig} config
 * @returns {Promise<Chat[]>}
 */
const scrapeChats = async (page, { chatsIncludeRegExp, messagesMaxRegExp }) => {
    /**
     * @param {Acc<Chat>} accumulator
     */
    const scrape = async accumulator => {
        const current = await getCurrentElement(
            accumulator,
            chatsIncludeRegExp
        );
        if (current.result) {
            return current.result;
        }
        const { unread, time, name, chat } = current;
        const { allChats, names, reachBottom, currentChats } = accumulator;
        names.push(name);
        if (unread) {
            // eslint-disable-next-line no-console
            console.log(`unread: ${name}, pass`);
            await sleep(2);
        } else {
            // eslint-disable-next-line no-console
            console.log(`scrape: ${name}`);
            await showMessages(chat);
            const messages = await scrapAllMessages(page, messagesMaxRegExp);
            await showContactDetail(page);
            const { phone, about } = await scrapeContact(page);
            allChats.push({ name, time, about, phone, messages });
        }

        return reachBottom && currentChats.length === 0
            ? allChats
            : scrape(await prepareNextAcc(page, accumulator, current));
    };
    return scrape(await createInitialAcc(page));
};

module.exports = { waitForChat, scrapeChats, scrapeContacts };
