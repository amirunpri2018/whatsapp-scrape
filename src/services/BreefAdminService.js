const axios = require('axios');
const { breefAdminApi, breefAdminAuthorization } = require('../../env');

/**
 * @typedef {object} Deal
 * @property {string} company
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
/**
 * @typedef {object} Lead
 * @property {string} owner
 * @property {string} name
 * @property {string} company
 * @property {string} phone
 */

const service = axios.default.create({
    baseURL: breefAdminApi,
    headers: { authorization: breefAdminAuthorization }
});

/** @param {Deal[]} data */
const postDeals = async data => service.post('/lead', { data });

/** @param {Contact[]} data */
const postContacts = async data => service.post('/contact', { data });

/** @param {Lead[]} data */
const postLeads = async data => service.post('/contact', { data });

module.exports = { postDeals, postContacts, postLeads };
