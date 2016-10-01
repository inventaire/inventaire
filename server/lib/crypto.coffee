CONFIG = require 'config'
__ = CONFIG.universalPath
pw = require('credential')()
error_ = __.require 'lib', 'error/error'
crypto = require 'crypto'

exports.passwords =
  # TODO: udpate to credentials > 2.0.0 when released to get rid
  # of the DeprecationWarning on crypto.pbkdf2 without specifying a digest
  hash: (password)->
    unless password? then return error_.reject('missing password', 400)
    pw.hash password

  verify: (hash, password, tokenDaysToLive)->
    unless hash? then return error_.reject 'missing hash', 400

    if tokenDaysToLive? and pw.expired hash, tokenDaysToLive
      return error_.reject 'token expired', 401

    unless password? then return error_.reject 'missing password', 400

    pw.verify hash, password

hash = (algo, input)->
  crypto.createHash algo
  .update input
  .digest 'hex'

exports.sha1 = hash.bind null, 'sha1'
exports.md5 = hash.bind null, 'md5'
