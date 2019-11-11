/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const error_ = __.require('lib', 'error/error');

module.exports = attributes => ({
  solveConstraint(model, attribute){
    const { possibilities, defaultValue } = attributes.constrained[attribute];
    if (possibilities.includes(model[attribute])) { return model[attribute];
    } else { return defaultValue; }
  }
});
