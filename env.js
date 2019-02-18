/**
 * @typedef {object} ENV
 * @property {string} port
 * @property {string} username
 * @property {string} password
 * @property {string} breefAdminApi
 * @property {string} breefAdminAuthorization
 * @property {string} chromeExecutablePath
 * @property {string} userDataDir
 * @property {'true' | 'false'} headless
 */

/** @type {ENV} */
const environment = process.env;

module.exports = environment;
