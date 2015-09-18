__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
getAuthorData = require './author'

module.exports = (authors)->
  promises_.all authors.map(_.property('key')).map(getAuthorData)
