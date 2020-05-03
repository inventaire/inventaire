const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const wdk = require('wikidata-sdk')
const wdEdit = __.require('lib', 'wikidata/edit')
const wdOauth = require('./wikidata_oauth')

module.exports = async (user, id, language, value) => {
  if (!wdk.isItemId(id)) throw error_.newInvalid('id', id)

  wdOauth.validate(user)
  const credentials = wdOauth.getOauthCredentials(user)

  return wdEdit.label.set({ id, language, value }, { credentials })
}
