CONFIG = require 'config'
_ = require './utils'
invCot = require('../cotDb').inv

module.exports =
  db: invCot
  isValidItem: (item)->
    requiredKeys = ['title', '_id', 'owner']
    valid = true
    requiredKeys.forEach (key)->
      if not item[key]
        console.log "missing key: #{key}"
        valid = false
    return valid

  byOwner: (owner)->
    return invCot.view 'items', 'byOwner', {key: owner}