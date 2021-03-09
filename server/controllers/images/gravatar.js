// An endpoint to get the request user email and convert it to a gravatar url
// so that a client can offer to import an existing avatar

const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const sanitize = require('lib/sanitize/sanitize')
const { md5 } = require('lib/crypto')

const sanitization = {}

// Get an image data-url from a URL
module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(() => {
    const { email } = req.user
    return getGravatarUrl(email)
  })
  .then(responses_.Wrap(res, 'url'))
  .catch(error_.Handler(req, res))
}

const getGravatarUrl = email => `${baseUrl}${getHash(email)}${queryString}`

const baseUrl = 'https://www.gravatar.com/avatar/'

// Default to a 404 error if no image exists
// see https://fr.gravatar.com/site/implement/images/
const queryString = '?d=404&s=500'

// See https://fr.gravatar.com/site/implement/hash/
const getHash = email => {
  email = email.trim().toLowerCase()
  return md5(email)
}
