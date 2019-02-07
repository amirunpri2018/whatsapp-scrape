/**
 * @typedef {object} ENV
 * @property {string} hostname
 * @property {string} port
 * @property {string} breefAdminApi
 * @property {string} breefAdminAuthorization
 * @property {string} chromeExecutablePath
 * @property {string} userDataDir
 */

/** @type {ENV} */
const environment = process.env;

module.exports = environment;
