const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { ownerSafeData } = require('./lib/authorized_user_data_pickers')

module.exports = (req, res) => {
  try {
    const data = getTailoredData(req, res)
    res.json(data)
  } catch (err) {
    error_.handler(req, res, err)
  }
}

const getTailoredData = (req, res) => {
  // The logged in user as its document set on req.user by passport.js
  const userPrivateData = ownerSafeData(req.user)

  if (res.locals.scope != null) {
    const scope = res.locals.scope[0]
    const attributesShortlist = attributesByScope[scope]
    if (!attributesShortlist) throw error_.new('invalid scope', 500, { scope })
    return _.pick(userPrivateData, attributesShortlist)
  } else {
    return userPrivateData
  }
}

const attributesByScope = {
  // This scope is tailored to the needs of https://github.com/inventaire/inventaire-mediawiki
  'wiki-stable-profile': [ '_id', 'email', 'username' ],
}
