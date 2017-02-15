CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ private:privateAttrs } = __.require('models', 'item').attributes

module.exports = (userId)-> (item)->
  if item.owner is userId
    return item
  else
    return _.omit item, privateAttrs
