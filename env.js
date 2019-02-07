/**
 * @typedef {object} ENV
 * @property {string} breefAdminApi
 * @property {string} chromeExecutablePath
 * @property {string} userDataDir
 */

/** @type {ENV} */
const environment = process.env;

module.exports = environment;
