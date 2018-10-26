CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
images_ = __.require 'lib', 'images'
# 'swift' or 'local'
{ mode } = CONFIG.mediaStorage
client = require "./#{mode}_client"

module.exports = (container, path, id, filename)->
  client.putImage container, path, filename
  .then _.Log('new image url')
  .then (url)-> { id, url }
