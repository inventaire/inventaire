CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports = (slug)->
  parts = slug.split('.')
  lastPart = _.last parts
  if _.isPositiveIntegerString lastPart
    next = parseInt(lastPart) + 1
    return parts.slice(0, -1).join('.') + ".#{next}"
  else
    return slug + '.1'
