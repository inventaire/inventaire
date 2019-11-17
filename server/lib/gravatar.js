// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const gravatar = require('gravatar')

module.exports = email => {
  // gravatar url params:
  // email, options= { d: default image, s: size }, https
  let url = gravatar.url(email, { d: 'mm', s: '500' }, true)
  // => https://s.gravatar.com/avatar/#{hash}?d=mm&s=500
  url = url.replace(/s\./, '')
  // => https://gravatar.com/avatar/#{hash}?d=mm&s=500
  return url
}
