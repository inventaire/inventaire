CONFIG = require 'config'
__ = CONFIG.root
Promise = require 'bluebird'
pw = Promise.promisifyAll require('credential')
error_ = __.require 'lib', 'error/error'

exports.passwords = passwords = {}

passwords.hash = (password)->
  unless password? then return error_.reject('missing password', 400)
  pw.hashAsync password

passwords.verify = (hash, password)->
  unless hash? then return error_.reject('missing hash', 400)
  unless password? then return error_.reject('missing password', 400)
  pw.verifyAsync hash, password
