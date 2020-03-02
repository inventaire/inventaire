const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const wdk = require('wikidata-sdk')
const wdEdit = require('wikidata-edit')
const wdOauth = require('./wikidata_oauth')

module.exports = async (user, id, lang, value) => {
  if (!wdk.isItemId(id)) throw error_.newInvalid('id', id)

  wdOauth.validate(user)
  const oauth = wdOauth.getFullCredentials(user)

  return wdEdit({ oauth }, 'label/set')(id, lang, value)
}
