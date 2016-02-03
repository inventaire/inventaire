CONFIG = require 'config'
__ = CONFIG.universalPath
pw = require('credential')()
error_ = __.require 'lib', 'error/error'
crypto = require 'crypto'

exports.passwords = passwords = {}

passwords.hash = (password)->
  unless password? then return error_.reject('missing password', 400)
  pw.hash password

passwords.verify = (hash, password)->
  unless hash? then return error_.reject('missing hash', 400)
  unless password? then return error_.reject('missing password', 400)
  pw.verify hash, password

hash = (algo, input)->
  crypto.createHash algo
  .update input
  .digest 'hex'

exports.sha1 = hash.bind null, 'sha1'
exports.md5 = hash.bind null, 'md5'
