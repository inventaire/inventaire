const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { pass, userId, itemId } = require('./common');

module.exports = { pass, userId, itemId };
