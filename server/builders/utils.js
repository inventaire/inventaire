const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = require('lodash');
const server_ = __.require('utils', 'base');
const logs_ = __.require('utils', 'logs')(_);
const json_ = __.require('utils', 'json');
const booleanValidations_ = __.require('lib', 'boolean_validations');

module.exports = _.extend(_, server_, logs_, json_, booleanValidations_);
