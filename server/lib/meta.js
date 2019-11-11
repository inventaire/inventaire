// a sub-level database to persist data on the application state
// that can be retrieved after the app restarts
const __ = require('config').universalPath;
const levelBase = __.require('level', 'base');
module.exports = levelBase.simpleSubDb('meta');
