CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
Subscriber = __.require 'models', 'subscriber'

module.exports =
  subscribe: (req, res, next)->
    promises_.start()
    .then createSubscriberDoc.bind(null, req)
    .then user_.db.post.bind(user_.db)
    .then -> res.send('ok')
    .catch error_.Handler(res)

createSubscriberDoc = (req)->
  {email} = req.body
  language = user_.findLanguage(req)
  return Subscriber.create(email, language)