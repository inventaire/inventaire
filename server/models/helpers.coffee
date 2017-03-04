CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = (attributes)->
  solveConstraint: (model, attribute)->
    { possibilities, defaultValue } = attributes.constrained[attribute]
    if model[attribute] in possibilities then model[attribute]
    else defaultValue
