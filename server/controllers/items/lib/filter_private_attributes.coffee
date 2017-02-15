CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ private:privateAttrs } = __.require('models', 'item').attributes

module.exports = (reqUserId)-> (item)->
  if item.owner is reqUserId
    return item
  else
    return _.omit item, privateAttrs
