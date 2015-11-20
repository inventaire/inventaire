CONFIG = require 'config'
__ = CONFIG.universalPath
Promise = require 'bluebird'
pw = Promise.promisifyAll require('credential')
error_ = __.require 'lib', 'error/error'
crypto = require 'crypto'

exports.passwords = passwords = {}

passwords.hash = (password)->
  unless password? then return error_.reject('missing password', 400)
  pw.hashAsync password

passwords.verify = (hash, password)->
  unless hash? then return error_.reject('missing hash', 400)
  unless password? then return error_.reject('missing password', 400)
  pw.verifyAsync hash, password

hash = (algo, input)->
  crypto.createHash algo
  .update input
  .digest 'hex'

exports.sha1 = hash.bind null, 'sha1'
exports.md5 = hash.bind null, 'md5'
