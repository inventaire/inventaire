// An endpoint to get the request user email and convert it to a gravatar url
// so that a client can offer to import an existing avatar

const { md5 } = require('lib/crypto')

const sanitization = {}

const controller = async (params, req) => {
  const { email } = req.user
  const url = await getGravatarUrl(email)
  return { url }
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

module.exports = { sanitization, controller }
