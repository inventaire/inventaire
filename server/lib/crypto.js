const pw = require('./password_hashing')
const error_ = require('lib/error/error')
const crypto = require('crypto')
const { promisify } = require('util')
const generateKeyPair = promisify(crypto.generateKeyPair)

const passwords = {
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

const sha1 = createHexHash('sha1')
const md5 = createHexHash('md5')
const sha1FromStream = createHexHashFromStream('sha1')

const getSha256Base64Digest = input => {
  return crypto.createHash('sha256')
  .update(input)
  .digest('base64')
}

const getRandomBytes = (length, encoding) => crypto.randomBytes(length).toString(encoding)

const keyPair = {
  generateKeyPair: async () => {
    // from https://github.com/dariusk/express-activitypub/blob/master/routes/admin.js#L50
    return generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
  }
}

module.exports = {
  passwords,
  sha1,
  md5,
  sha1FromStream,
  getSha256Base64Digest,
  getRandomBytes,
  keyPair,
}
