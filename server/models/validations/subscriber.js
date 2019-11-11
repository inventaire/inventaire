const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { Lang } = __.require('lib', 'regex');
const { pass, email } = require('./common');

module.exports = {
  pass,
  email,
  language(lang){ return /^\w{2}(-\w{2})?$/.test(lang); }
};
