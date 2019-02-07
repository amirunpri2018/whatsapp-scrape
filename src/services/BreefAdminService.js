const axios = require('axios');
const { breefAdminApi } = require('../../env');

/**
 * @typedef {object} Deal
 * @property {string} name
 * @property {string} owner
 * @property {string} value
 * @property {string} probability
 * @property {string} milestone
 * @property {string} dealSource
 * @property {string[]} relatedTo
 */
/**
 * @typedef {object} Contact
 * @property {string} name
 * @property {string} company
 * @property {string} sources
 * @property {string} phone
 * @property {string} owner
 */

const service = axios.default.create({ baseURL: breefAdminApi });

/** @param {Deal[]} data */
const postDeals = async data => service.post('/lead', { data });

/** @param {Contact[]} data */
const postContacts = async data => service.post('/contact', { data });

module.exports = { postDeals, postContacts };
