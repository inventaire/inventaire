const _ = require('builders/utils')
const error_ = require('lib/error/error')
const requests_ = require('lib/requests')
const crypto = require('crypto')
const assert_ = require('lib/utils/assert_types')
const { expired } = require('lib/time')
const { getSha256Base64Digest } = require('lib/crypto')

const security_ = module.exports = {
  sign: params => {
    const { keyId, privateKey, headers = '(request-target) host date' } = params
    const signer = crypto.createSign('rsa-sha256')
    const stringToSign = buildSignatureString(params)
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(privateKey)
    const signatureB64 = signature.toString('base64')
    // headers must respect signature string keys order
    // ie. (request-target) host date
    // see Section 2.3 of https://tools.ietf.org/html/draft-cavage-http-signatures-08
    return `keyId="${keyId}",headers="${headers}",signature="${signatureB64}"`
  },

  verifySignature: async req => {
    const { method, path: endpoint, headers: reqHeaders } = req
    const { date, signature } = reqHeaders
    // 30 seconds time window for thtat signature to be considered valid
    if (thirtySecondsTimeWindow(date)) throw error_.new('outdated request', 400, reqHeaders)
    if (signature === undefined) throw error_.new('no signature header', 400, reqHeaders)
    // "headers" below specify the list of HTTP headers included when generating the signature for the message
    const { keyId: actorUrl, signature: signatureString, headers } = parseSignature(signature)
    const publicKey = await fetchActorPublicKey(actorUrl)
    const verifier = crypto.createVerify('rsa-sha256')
    const signedString = buildSignatureString(Object.assign(reqHeaders, { headers, method: method.toLowerCase(), endpoint }))
    verifier.update(signedString)
    if (!(verifier.verify(publicKey.publicKeyPem, signatureString, 'base64'))) {
      throw error_.new('signature verification failed', 400, { publicKey })
    }
    // TODO: verify date
  },

  signRequest: ({ method, keyId, privateKey, endpoint, body }) => {
    if (!endpoint) endpoint = '/api/activitypub'
    const date = (new Date()).toUTCString()
    const { host } = new URL(keyId)
    // The minimum recommended data to sign is the (request-target), host, and date.
    // Source: https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-10#appendix-C.2
    // The digest is additionnal required by Mastodon
    // Source: https://github.com/mastodon/mastodon/blob/main/app/controllers/concerns/signature_verification.rb
    const signatureHeaders = { host, date }
    if (body) {
      assert_.object(body)
      signatureHeaders.digest = `SHA-256=${getSha256Base64Digest(JSON.stringify(body))}`
    }
    const signatureHeadersInfo = `(request-target) ${Object.keys(signatureHeaders).join(' ')}`
    const signature = security_.sign(Object.assign({
      headers: signatureHeadersInfo,
      method,
      keyId,
      privateKey,
      endpoint
    }, signatureHeaders))
    return Object.assign({ signature }, signatureHeaders)
  }
}

const buildSignatureString = params => {
  // 'method' must be lowercased
  // 'date' must be a UTC string
  const { headers, method, endpoint } = params
  // arrayfying because key order matters
  const headersKeys = headers.split(' ')
  let signatureString = `(request-target): ${method} ${endpoint}`
  for (const key of headersKeys) {
    if (params[key]) {
      signatureString = signatureString.concat('\n', `${key}: ${params[key]}`)
    }
  }
  return signatureString
}

const fetchActorPublicKey = async actorUrl => {
  const actor = await requests_.get(actorUrl)
  assert_.object(actor)
  const { publicKey } = actor
  if (!publicKey || !_.isNonEmptyPlainObject(publicKey)) {
    throw error_.new('no publicKey found', 400, actor)
  }
  const { publicKeyPem } = actor.publicKey
  if (!publicKeyPem) {
    throw error_.new('no publicKeyPem found', 400, actor)
  }
  // TODO: check if string MUST start with 'begin public key' in the specs
  if (!publicKeyPem.startsWith('-----BEGIN PUBLIC KEY-----\n')) {
    throw error_.new('invalid publicKeyPem found', 400, actor.publicKey)
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

const thirtySecondsTimeWindow = date => expired(Date.parse(date), 30000)
