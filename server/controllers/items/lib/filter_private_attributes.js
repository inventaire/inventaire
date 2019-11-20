
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { private: privateAttrs } = __.require('models', 'item').attributes

const omitPrivateAttributes = item => _.omit(item, privateAttrs)

module.exports = {
  omitPrivateAttributes,
  filterPrivateAttributes: reqUserId => {
    return item => {
      if (item.owner === reqUserId) {
        return item
      } else {
        return omitPrivateAttributes(item)
      }
    }
  }
}
