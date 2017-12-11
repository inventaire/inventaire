__ = require('config').universalPath
_ = __.require 'builders', 'utils'

checkEntity = require './check_entity'

module.exports = (entities)->
  checkNextEntity = ->
      entity = entities.pop()
      unless entity? then return

      checkEntity entity
      .then checkNextEntity

  return checkNextEntity()
