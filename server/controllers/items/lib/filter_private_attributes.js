// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { private:privateAttrs } = __.require('models', 'item').attributes

const omitPrivateAttributes = item => _.omit(item, privateAttrs)

module.exports = {
  omitPrivateAttributes,
  filterPrivateAttributes(reqUserId){ return function(item){
    if (item.owner === reqUserId) { return item
    } else { return omitPrivateAttributes(item) }
  } }
}
