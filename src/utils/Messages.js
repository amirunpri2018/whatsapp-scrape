const contactRegex = /^Create Contact\nName : .+?\nCompany : .+?\nSources : .+?\nAdd Phone : .+?\nOwner : .+?$/i;
// eslint-disable-next-line no-useless-escape
const contactSplitter = /^Create Contact\nName : \s*|\s+Company : \s*|\s+Sources : \s*|\s+Add Phone : \s*|\s+Owner : \s*|\s+\z/gi;

const dealRegex = /^Create Deal\nName : .+?\nOwner : .+?\nValue : .+?\nProbability : .+?\nMilestone : .+?\nDeal Source : .+?\nRelated to : .+?$/i;
// eslint-disable-next-line no-useless-escape
const dealSplitter = /^Create Deal\nName : \s*|\s+Owner : \s*|\s+Value : \s*|\s+Probability : \s*|\s+Milestone : \s*|\s+Deal Source : \s*|\s+Related to : \s*|\s+\z/gi;
const relatedToSplitter = /^\s*|\s*?,\s*|\s*$/gi;

/** @param {string} text */
const isContact = text => contactRegex.test(text);

/** @param {string} text */
const isDeal = text => dealRegex.test(text);

/** @param {string} text */
const notEmpty = text => text && text.length > 0;

/** @param {string} text */
const parseDeal = text => {
    const split = text.split(dealSplitter);
    return {
        name: split[1],
        owner: split[2],
        value: split[3],
        probability: split[4],
        milestone: split[5],
        dealSource: split[6],
        relatedTo: split[7].split(relatedToSplitter).filter(notEmpty)
    };
};

/** @param {string} text */
const parseContact = text => {
    const split = text.split(contactSplitter);
    return {
        name: split[1],
        company: split[2],
        sources: split[3],
        phone: split[4],
        owner: split[5]
    };
};

module.exports = { isContact, isDeal, parseContact, parseDeal };
