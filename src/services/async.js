/**
 * @summary wrapper for async middleware to catch errors
 * @param {*} fn - Accepts an async function, or promise 
 * @copyright https://medium.com/%40Abazhenov/using-async-await-in-express-with-node-8-b8af872c0016
 */
const Logger = require('./logger')

module.exports = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(e => next(Logger.error(e)))
}