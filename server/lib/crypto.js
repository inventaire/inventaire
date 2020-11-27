const CONFIG = require('config')
const __ = CONFIG.universalPath
const pw = require('./password_hashing')
const error_ = __.require('lib', 'error/error')
const crypto = require('crypto')

exports.passwords = {
  hash: async password => {
    if (password == null) throw error_.new('missing password', 400)
    return pw.hash(password)
  },

  verify: async (hash, password, tokenDaysToLive) => {
    if (hash == null) throw error_.new('missing hash', 400)

    if (tokenDaysToLive != null && pw.expired(hash, tokenDaysToLive)) {
      throw error_.new('token expired', 401)
    }

    if (password == null) throw error_.new('missing password', 400)

    return pw.verify(hash, password)
  }
}

const createHexHash = algo => input => {
  return crypto.createHash(algo)
  .update(input)
  .digest('hex')
}

exports.sha1 = createHexHash('sha1')
exports.md5 = createHexHash('md5')

exports.getRandomBytesBuffer = length => crypto.randomBytes(length)
