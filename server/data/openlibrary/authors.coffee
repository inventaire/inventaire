__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
getAuthorData = require './author'

module.exports = (authorsKeys)->
  _.log authorsKeys, 'authorsKeys'
  promises_.all authorsKeys.map(getAuthorData)
