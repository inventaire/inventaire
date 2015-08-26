CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports =
  byEmails: (db, emails)->
    _.type emails, 'array'
    db.viewByKeys 'byEmail', emails.map(_.toLowerCase)