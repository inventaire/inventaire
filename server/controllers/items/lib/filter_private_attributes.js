const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const { private: privateAttrs } = require('models/item').attributes

const omitPrivateAttributes = item => _.omit(item, privateAttrs)

module.exports = {
  omitPrivateAttributes,

  filterPrivateAttributes: reqUserId => item => {
    if (item.owner === reqUserId) return item
    else return omitPrivateAttributes(item)
  }
}
