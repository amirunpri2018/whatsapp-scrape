/**
 * @param {number} seconds
 * @returns {Promise<void>}
 */
const sleep = seconds => {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
};

module.exports = { sleep };
