const CONFIG = require('config')
const __ = CONFIG.universalPath
const pw = require('./password_hashing')
const error_ = __.require('lib', 'error/error')
const crypto = require('crypto')

exports.passwords = {
  hash: password => {
    if (password == null) return error_.reject('missing password', 400)
    return pw.hash(password)
  },

  verify: (hash, password, tokenDaysToLive) => {
    if (hash == null) return error_.reject('missing hash', 400)

    if ((tokenDaysToLive != null) && pw.expired(hash, tokenDaysToLive)) {
      return error_.reject('token expired', 401)
    }

    if (password == null) return error_.reject('missing password', 400)

    return pw.verify(hash, password)
  }
}

const hash = (algo, input) => crypto.createHash(algo)
.update(input)
.digest('hex')

exports.sha1 = hash.bind(null, 'sha1')
exports.md5 = hash.bind(null, 'md5')
