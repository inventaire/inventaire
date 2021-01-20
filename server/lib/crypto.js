const pw = require('./password_hashing')
const error_ = require('lib/error/error')
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

const createHexHashFromStream = algo => stream => new Promise((resolve, reject) => {
  const sum = crypto.createHash(algo)
  return stream
  .on('data', sum.update.bind(sum))
  .on('end', () => resolve(sum.digest('hex')))
  .on('error', reject)
})

exports.sha1 = createHexHash('sha1')
exports.md5 = createHexHash('md5')
exports.sha1FromStream = createHexHashFromStream('sha1')

exports.getRandomBytes = (length, encoding) => crypto.randomBytes(length).toString(encoding)
