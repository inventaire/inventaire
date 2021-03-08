const error_ = require('lib/error/error')
const requests_ = require('lib/requests')
const crypto = require('crypto')
const assert_ = require('lib/utils/assert_types')

const API = module.exports = {
  sign: async ({ method, keyUrl, privateKey, endpoint, hostname, date }) => {
    const signer = crypto.createSign('rsa-sha256')
    const stringToSign = API.buildSignatureString({ method, hostname, endpoint, date })
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(privateKey)
    const signatureB64 = signature.toString('base64')
    // headers must respect signature string keys order
    // ie. (request-target) host date
    // see Section 2.3 of https://tools.ietf.org/html/draft-cavage-http-signatures-08
    const headers = '(request-target) host date'
    return `keyId="${keyUrl}",headers="${headers}",signature="${signatureB64}"`
  },

  buildSignatureString: ({ method, hostname, endpoint, date }) => {
    // 'method' must be lowercased
    // 'date' should be a UTC string
    return `(request-target): ${method} ${endpoint}\nhost: ${hostname}\ndate: ${date}`
  },

  verifySignature: async req => {
    const { hostname, method, path: endpoint, headers } = req
    const { date, signature } = headers
    if (!(signature)) throw error_.new('no signature header', 500, headers)
    const { keyId: actorUrl, signature: signatureString } = parseSignature(signature)
    const publicKey = await fetchActorPublicKey(actorUrl)
    const verifier = crypto.createVerify('rsa-sha256')
    const signedString = API.buildSignatureString({ method: method.toLowerCase(), hostname, endpoint, date })
    verifier.update(signedString)
    if (!(verifier.verify(publicKey, signatureString, 'base64'))) {
      throw error_.new('signature verification failed', 400, { publicKey })
    }
    // TODO: verify date
  }
}

const fetchActorPublicKey = async actorUrl => {
  const actor = await requests_.get(actorUrl)
  assert_.object(actor)
  const { publicKey } = actor
  if (!publicKey) {
    throw error_.new('no publicKey found', 500, actor)
  }
  // TODO: check if start string begin public key is in the specs
  if (!publicKey.startsWith('-----BEGIN PUBLIC KEY-----\n')) {
    throw error_.new('invalid publicKey found', 500, publicKey)
  }
  // TODO: handle timeout
  return actor.publicKey
}

const parseSignature = signature => {
  const signatureParts = signature.split('",')
  const signatureObj = {}
  for (const part of signatureParts) {
    // trailing =" for signature key
    let [ key, value ] = part.split('="')
    if (key === 'signature') value += '='
    signatureObj[key] = removeTrailingQuote(value)
  }
  return signatureObj
}

const removeTrailingQuote = line => line.replace(/"$/, '')
