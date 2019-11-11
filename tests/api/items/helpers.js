/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

module.exports = {
  newItemBase() { return { entity: 'wd:Q3548806', lang: 'fr' }; },

  CountChange(snapBefore, snapAfter){ return function(section){
    const before = snapBefore[section]['items:count'];
    const after = snapAfter[section]['items:count'];
    return after - before;
  }; }
};
