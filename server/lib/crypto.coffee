Promise = require 'bluebird'
pw = Promise.promisifyAll require('credential')

module.exports =
  passwords:
    hash: (password)-> pw.hashAsync password
    verify: (hash, password)-> pw.verifyAsync hash, password