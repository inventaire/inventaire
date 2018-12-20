CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'

module.exports = handlers =
  byEmail: (db, email)->
    assert_.string email
    db.viewByKey 'byEmail', email.toLowerCase()

  byEmails: (db, emails)->
    assert_.strings emails
    db.viewByKeys 'byEmail', emails.map(_.toLowerCase)

  findOneByEmail: (db, email)->
    handlers.byEmail db, email
    .then couch_.firstDoc
    .then (user)->
      if user? then return user
      else throw error_.notFound email
