CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
error_ = __.require 'lib', 'error/error'

module.exports = handlers =
  byEmail: (db, email)->
    _.assertType email, 'string'
    db.viewByKey 'byEmail', email.toLowerCase()

  byEmails: (db, emails)->
    _.assertType emails, 'array'
    db.viewByKeys 'byEmail', emails.map(_.toLowerCase)

  findOneByEmail: (db, email)->
    handlers.byEmail db, email
    .then couch_.firstDoc
    .then (user)->
      if user? then return user
      else throw error_.notFound email
