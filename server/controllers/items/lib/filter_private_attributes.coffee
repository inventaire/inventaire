CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ private:privateAttrs } = __.require('models', 'item').attributes

omitPrivateAttributes = (item)-> _.omit item, privateAttrs

module.exports =
  omitPrivateAttributes: omitPrivateAttributes
  filterPrivateAttributes: (reqUserId)-> (item)->
    if item.owner is reqUserId then return item
    else return omitPrivateAttributes item
