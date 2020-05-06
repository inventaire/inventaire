const __ = require('config').universalPath
const requests_ = __.require('lib', 'requests')
const error_ = __.require('lib', 'error/error')

module.exports = async (url, expectedContentType) => {
  const { headers } = await requests_.head(url)
  const contentType = headers['content-type']
  if (expectedContentType != null && contentType !== expectedContentType) {
    throw error_.new('cover not found', 404, url)
  } else {
    return url
  }
}
