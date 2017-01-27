CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
onlineUsers = require './lib/online_users'

module.exports = (req, res)->
  { headers } = req
  { 'user-agent':userAgent } = headers

  # Excluding bots from online counts
  if isBot(userAgent) then return _.ok res

  onlineUsers
    userId: req.user?._id
    # For production, when behind a Nginx proxy
    ip: headers['x-forwarded-for']
    userAgent: headers['user-agent']
    lang: headers['accept-language']?.split(',')?[0]

  _.ok res

# In production, bots should be routed to use prerender
# cf https://github.com/inventaire/inventaire-deploy/blob/f3cda7210d29d9b3bfb983f8fbb1106c43c18968/nginx/inventaire.original.nginx#L160
isBot = (userAgent)-> /prerender/.test userAgent
