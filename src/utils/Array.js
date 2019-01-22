'use strict';

/**
 * @callback AsyncForEachCallback
 * @param {T} currentValue
 * @param {number} currentIndex
 * @param {T[]} array
 * @returns {Promise<void>}
 * @template T
 */
/**
 * @param {T[]} array
 * @param {AsyncForEachCallback<T>} callback
 * @template T
 */
const asyncForEach = async (array, callback) =>
    array.reduce(async (acc, currentValue, currentIndex, arr) => {
        await acc;
        return callback(currentValue, currentIndex, arr);
    }, Promise.resolve());

module.exports = { asyncForEach };
