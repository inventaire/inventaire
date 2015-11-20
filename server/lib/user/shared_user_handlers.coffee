CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'

module.exports = handlers =
  byEmail: (db, email)->
    _.type email, 'string'
    db.viewByKey 'byEmail', email.toLowerCase()

  byEmails: (db, emails)->
    _.type emails, 'array'
    db.viewByKeys 'byEmail', emails.map(_.toLowerCase)

  findOneByEmail: (db, email)->
    handlers.byEmail db, email
    .then couch_.firstDoc