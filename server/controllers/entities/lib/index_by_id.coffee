__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (entities)-> _.indexBy entities, '_id'
