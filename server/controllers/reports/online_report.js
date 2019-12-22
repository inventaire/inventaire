const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const onlineUsers = require('./lib/online_users')
const responses_ = __.require('lib', 'responses')
const headers_ = __.require('lib', 'headers')

module.exports = (req, res) => {
  const { headers } = req
  const { 'user-agent': userAgent } = headers

  // Excluding bots from online counts
  if (isBot(userAgent)) return _.ok(res)

  onlineUsers({
    userId: req.user && req.user._id,
    // For production, when behind a Nginx proxy
    ip: headers['x-forwarded-for'],
    userAgent: headers['user-agent'],
    lang: headers_.getLang(headers)
  })

  responses_.ok(res)
}

// In production, bots should be routed to use prerender
// cf https://github.com/inventaire/inventaire-deploy/blob/f3cda7210d29d9b3bfb983f8fbb1106c43c18968/nginx/inventaire.original.nginx#L160
const isBot = userAgent => /prerender/.test(userAgent)
