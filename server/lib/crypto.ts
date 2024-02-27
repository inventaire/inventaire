import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { newError } from '#lib/error/error'
import pw from './password_hashing.js'

const generateKeyPair = promisify(crypto.generateKeyPair)

export const passwords = {
  hash: async password => {
    if (password == null) throw newError('missing password', 400)
    return pw.hash(password)
  },

  verify: async (hash, password, tokenDaysToLive) => {
    if (hash == null) throw newError('missing hash', 400)

    if (tokenDaysToLive != null && pw.expired(hash, tokenDaysToLive)) {
      throw newError('token expired', 401)
    }

    if (password == null) throw newError('missing password', 400)

    return pw.verify(hash, password)
  },
}

export const createHexHash = algo => input => {
  return crypto.createHash(algo)
  .update(input)
  .digest('hex')
}

export const createHexHashFromStream = algo => stream => new Promise((resolve, reject) => {
  const sum = crypto.createHash(algo)
  return stream
  .on('data', sum.update.bind(sum))
  .on('end', () => resolve(sum.digest('hex')))
  .on('error', reject)
})

export const sha1 = createHexHash('sha1')
export const md5 = createHexHash('md5')
export const sha1FromStream = createHexHashFromStream('sha1')

export function getSha256Base64Digest (input) {
  return crypto.createHash('sha256')
  .update(input)
  .digest('base64')
}

export const getRandomBytes = (length, encoding) => crypto.randomBytes(length).toString(encoding)

export const generateRsaKeyPair = async () => {
  // from https://github.com/dariusk/express-activitypub/blob/master/routes/admin.js#L50
  return generateKeyPair('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })
}
